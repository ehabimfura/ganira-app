import { Router, type Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { hashSecret, verifySecret } from "../auth/passwords.js";
import { createRateLimiter } from "../auth/rate-limit.js";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { dailyGoal, level } from "../onboarding.js";

export const MAX_CHILDREN = 6;
const WINDOW_MS = 15 * 60 * 1000;
const PIN_MAX_ATTEMPTS = 5;
const UNLOCK_MAX_ATTEMPTS = 10;

const pin = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits");
const profileId = z.coerce.number().int().positive();

const createChildSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  avatar: z.string().trim().min(1).max(50),
  ageRange: z.string().trim().max(20).optional(),
  // The parent answers these for the child; a child's path is always Family.
  level,
  dailyGoalMinutes: dailyGoal,
  pin: pin.optional(),
  // The parent must tick "I am this child's parent or guardian".
  consent: z.literal(true),
});
const selectSchema = z.object({ pin: pin.optional() });
const unlockSchema = z.object({ password: z.string().min(1).max(200) });
const setPinSchema = z.object({ pin: pin.nullable() });

// Parent mode: a parent account with no child profile open on this phone.
function inParentMode(session: SessionInfo): boolean {
  return session.accountKind === "PARENT" && session.activeLearnerId === null;
}

function refuseUnlessParentMode(res: Response): boolean {
  if (inParentMode(res.locals.session)) return false;
  res.status(403).json({ error: "PARENT_MODE_REQUIRED" });
  return true;
}

function invalidInput(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: z.flattenError(error).fieldErrors });
}

async function findOwnProfile(db: Database, accountId: number, id: number) {
  const [rows] = await db.pool.query<RowDataPacket[]>(
    "SELECT id, kind, pin_hash FROM learners WHERE id = ? AND account_id = ?",
    [id, accountId],
  );
  return rows[0];
}

export function profileRoutes(db: Database) {
  const router = Router();
  const pinLimiter = createRateLimiter(PIN_MAX_ATTEMPTS, WINDOW_MS);
  const unlockLimiter = createRateLimiter(UNLOCK_MAX_ATTEMPTS, WINDOW_MS);
  router.use(["/profiles", "/parent"], requireSession(db));

  router.post("/profiles", async (req, res) => {
    if (refuseUnlessParentMode(res)) return;
    const parsed = createChildSchema.safeParse(req.body);
    if (!parsed.success) return invalidInput(res, parsed.error);
    const input = parsed.data;
    const session: SessionInfo = res.locals.session;

    const [counts] = await db.pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM learners WHERE account_id = ?",
      [session.accountId],
    );
    if (counts[0].n >= MAX_CHILDREN) {
      res.status(409).json({ error: "TOO_MANY_PROFILES" });
      return;
    }

    const pinHash = input.pin ? await hashSecret(input.pin) : null;
    const conn = await db.pool.getConnection();
    try {
      // The child and the parent's consent are saved together or not at all.
      await conn.beginTransaction();
      const [child] = await conn.query<ResultSetHeader>(
        `INSERT INTO learners
           (account_id, kind, path, level, daily_goal_minutes, nickname, avatar, age_range, pin_hash)
         VALUES (?, 'CHILD', 'FAMILY', ?, ?, ?, ?, ?, ?)`,
        [
          session.accountId,
          input.level,
          input.dailyGoalMinutes,
          input.nickname,
          input.avatar,
          input.ageRange ?? null,
          pinHash,
        ],
      );
      await conn.query("INSERT INTO parental_consents (parent_account_id, learner_id) VALUES (?, ?)", [
        session.accountId,
        child.insertId,
      ]);
      await conn.commit();
      res.status(201).json({ id: child.insertId });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  });

  router.post("/profiles/:id/select", async (req, res) => {
    const id = profileId.safeParse(req.params.id);
    const body = selectSchema.safeParse(req.body ?? {});
    if (!id.success) return invalidInput(res, id.error);
    if (!body.success) return invalidInput(res, body.error);
    const session: SessionInfo = res.locals.session;

    // Only profiles on this account; someone else's child looks the same as a missing one.
    const profile = await findOwnProfile(db, session.accountId, id.data);
    if (!profile) {
      res.status(404).json({ error: "PROFILE_NOT_FOUND" });
      return;
    }

    if (profile.pin_hash) {
      const limitKey = `pin|${profile.id}`;
      if (!pinLimiter.tryAttempt(limitKey)) {
        res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
        return;
      }
      if (!body.data.pin || !(await verifySecret(profile.pin_hash, body.data.pin))) {
        res.status(401).json({ error: "WRONG_PIN" });
        return;
      }
      pinLimiter.reset(limitKey);
    }

    await db.pool.query("UPDATE sessions SET active_learner_id = ? WHERE id = ?", [profile.id, session.sessionId]);
    res.json({ activeProfileId: profile.id });
  });

  router.put("/profiles/:id/pin", async (req, res) => {
    if (refuseUnlessParentMode(res)) return;
    const id = profileId.safeParse(req.params.id);
    const body = setPinSchema.safeParse(req.body);
    if (!id.success) return invalidInput(res, id.error);
    if (!body.success) return invalidInput(res, body.error);
    const session: SessionInfo = res.locals.session;

    const profile = await findOwnProfile(db, session.accountId, id.data);
    if (!profile || profile.kind !== "CHILD") {
      res.status(404).json({ error: "PROFILE_NOT_FOUND" });
      return;
    }
    const pinHash = body.data.pin ? await hashSecret(body.data.pin) : null;
    await db.pool.query("UPDATE learners SET pin_hash = ? WHERE id = ?", [pinHash, profile.id]);
    res.status(204).end();
  });

  // Back to parent mode from a child's profile: needs the parent's password.
  router.post("/parent/unlock", async (req, res) => {
    const session: SessionInfo = res.locals.session;
    if (session.accountKind !== "PARENT") {
      res.status(403).json({ error: "PARENT_ACCOUNT_REQUIRED" });
      return;
    }
    const parsed = unlockSchema.safeParse(req.body);
    if (!parsed.success) return invalidInput(res, parsed.error);

    const limitKey = `unlock|${session.accountId}`;
    if (!unlockLimiter.tryAttempt(limitKey)) {
      res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
      return;
    }
    const [rows] = await db.pool.query<RowDataPacket[]>("SELECT password_hash FROM accounts WHERE id = ?", [
      session.accountId,
    ]);
    if (!(await verifySecret(rows[0].password_hash, parsed.data.password))) {
      res.status(401).json({ error: "WRONG_PASSWORD" });
      return;
    }
    unlockLimiter.reset(limitKey);

    await db.pool.query("UPDATE sessions SET active_learner_id = NULL WHERE id = ?", [session.sessionId]);
    res.json({ activeProfileId: null });
  });

  return router;
}
