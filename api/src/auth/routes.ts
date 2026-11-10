import { Router, type Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import type { Database } from "../db.js";
import { ADULT_PATH, learnerOnboarding } from "../onboarding.js";
import { isAdult } from "./age.js";
import { hashSecret, MIN_PASSWORD_LENGTH, verifyAgainstDummy, verifySecret } from "./passwords.js";
import { createRateLimiter } from "./rate-limit.js";
import { requireSession, type SessionInfo } from "./session.js";
import { hashToken, newToken, sessionExpiry } from "./tokens.js";

const SIGNIN_MAX_ATTEMPTS = 10;
const SIGNIN_WINDOW_MS = 15 * 60 * 1000;

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
// Stored lowercase, so "John" and "john" are the same person.
const username = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().regex(/^[a-z0-9_]{3,20}$/, "3-20 letters, numbers or _"));
const password = z.string().min(MIN_PASSWORD_LENGTH).max(200);
const adultFields = { email, username, password, birthYear: z.number().int().min(1900) };

const signupSchema = z.discriminatedUnion("kind", [
  z.object({ ...adultFields, kind: z.literal("PARENT") }),
  z.object({
    ...adultFields,
    kind: z.literal("LEARNER"),
    nickname: z.string().trim().min(1).max(40),
    avatar: z.string().trim().min(1).max(50),
    ...learnerOnboarding,
  }),
]);

// One box for email or username: anything with "@" is treated as an email.
const signinSchema = z.object({
  login: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(200),
});

function duplicateError(error: unknown): string | null {
  const { code, message } = error as { code?: string; message?: string };
  if (code !== "ER_DUP_ENTRY") return null;
  return message?.includes("uq_accounts_username") ? "USERNAME_TAKEN" : "EMAIL_TAKEN";
}

function invalidInput(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: z.flattenError(error).fieldErrors });
}

async function createSession(db: Database, accountId: number, activeLearnerId: number | null) {
  const token = newToken();
  await db.pool.query(
    "INSERT INTO sessions (account_id, active_learner_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [accountId, activeLearnerId, hashToken(token), sessionExpiry()],
  );
  return token;
}

export function authRoutes(db: Database) {
  const router = Router();
  const signinLimiter = createRateLimiter(SIGNIN_MAX_ATTEMPTS, SIGNIN_WINDOW_MS);

  router.post("/auth/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return invalidInput(res, parsed.error);
    const input = parsed.data;

    // Under-age: refuse before saving anything, including the email.
    if (!isAdult(input.birthYear)) {
      res.status(403).json({ error: "UNDER_AGE" });
      return;
    }

    const passwordHash = await hashSecret(input.password);
    const conn = await db.pool.getConnection();
    let accountId: number;
    let selfLearnerId: number | null = null;
    try {
      // Account and its SELF profile are saved together or not at all.
      await conn.beginTransaction();
      const [account] = await conn.query<ResultSetHeader>(
        "INSERT INTO accounts (email, username, password_hash, kind, birth_year) VALUES (?, ?, ?, ?, ?)",
        [input.email, input.username, passwordHash, input.kind, input.birthYear],
      );
      accountId = account.insertId;
      if (input.kind === "LEARNER") {
        const [learner] = await conn.query<ResultSetHeader>(
          `INSERT INTO learners (account_id, kind, nickname, avatar, path, level, daily_goal_minutes)
           VALUES (?, 'SELF', ?, ?, ?, ?, ?)`,
          [accountId, input.nickname, input.avatar, ADULT_PATH, input.level, input.dailyGoalMinutes],
        );
        selfLearnerId = learner.insertId;
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      const duplicate = duplicateError(error);
      if (duplicate) {
        res.status(409).json({ error: duplicate });
        return;
      }
      throw error;
    } finally {
      conn.release();
    }

    const token = await createSession(db, accountId, selfLearnerId);
    res.status(201).json({ token });
  });

  router.post("/auth/signin", async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) return invalidInput(res, parsed.error);
    const input = parsed.data;

    const limitKey = `${input.login}|${req.ip}`;
    const column = input.login.includes("@") ? "email" : "username";
    if (!signinLimiter.tryAttempt(limitKey)) {
      res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
      return;
    }

    const [rows] = await db.pool.query<RowDataPacket[]>(
      `SELECT a.id, a.password_hash, a.kind,
              (SELECT l.id FROM learners l WHERE l.account_id = a.id AND l.kind = 'SELF') AS self_id
         FROM accounts a WHERE a.${column} = ?`,
      [input.login],
    );
    const account = rows[0];
    const ok = account
      ? await verifySecret(account.password_hash, input.password)
      : await verifyAgainstDummy(input.password);
    if (!account || !ok) {
      // Same message either way, so it doesn't reveal which emails have accounts.
      res.status(401).json({ error: "WRONG_LOGIN_OR_PASSWORD" });
      return;
    }

    signinLimiter.reset(limitKey);
    const token = await createSession(db, account.id, account.self_id ?? null);
    res.json({ token });
  });

  router.post("/auth/signout", requireSession(db), async (_req, res) => {
    const session: SessionInfo = res.locals.session;
    await db.pool.query("DELETE FROM sessions WHERE id = ?", [session.sessionId]);
    res.status(204).end();
  });

  router.get("/me", requireSession(db), async (_req, res) => {
    const session: SessionInfo = res.locals.session;
    const [accounts] = await db.pool.query<RowDataPacket[]>(
      "SELECT id, email, username, kind FROM accounts WHERE id = ?",
      [session.accountId],
    );
    const [learners] = await db.pool.query<RowDataPacket[]>(
      `SELECT id, kind, nickname, avatar, path, level, daily_goal_minutes, pin_hash IS NOT NULL AS has_pin
         FROM learners WHERE account_id = ? ORDER BY id`,
      [session.accountId],
    );
    const [progress] = await db.pool.query<RowDataPacket[]>(
      `SELECT p.learner_id, p.lesson_id
         FROM lesson_progress p JOIN learners l ON l.id = p.learner_id
        WHERE l.account_id = ? ORDER BY p.completed_at, p.lesson_id`,
      [session.accountId],
    );
    const completedBy = (learnerId: number) =>
      progress.filter((p) => p.learner_id === learnerId).map((p) => p.lesson_id as string);
    res.json({
      account: accounts[0],
      profiles: learners.map((l) => ({
        id: l.id,
        kind: l.kind,
        nickname: l.nickname,
        avatar: l.avatar,
        path: l.path,
        level: l.level,
        dailyGoalMinutes: l.daily_goal_minutes,
        hasPin: Boolean(l.has_pin),
        completedLessons: completedBy(l.id),
      })),
      activeProfileId: session.activeLearnerId,
    });
  });

  return router;
}
