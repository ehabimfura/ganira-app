import type { RowDataPacket } from "mysql2/promise";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { hashToken } from "../src/auth/tokens.js";
import { createDatabase } from "../src/db.js";
import { freshTestDatabase, testDbSettings } from "./test-db.js";

const db = createDatabase(testDbSettings);
const app = createApp(db);
const thisYear = new Date().getUTCFullYear();
const PASSWORD = "correct horse";

function signupLearner(email: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/auth/signup")
    .send({ email, password: PASSWORD, birthYear: 1995, kind: "LEARNER", nickname: "Ann", avatar: "lion", ...overrides });
}

function signupParent(email: string, overrides: Record<string, unknown> = {}) {
  return request(app).post("/auth/signup").send({ email, password: PASSWORD, birthYear: 1985, kind: "PARENT", ...overrides });
}

function me(token: string) {
  return request(app).get("/me").set("Authorization", `Bearer ${token}`);
}

async function countAccounts(email: string): Promise<number> {
  const [rows] = await db.pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM accounts WHERE email = ?", [email]);
  return rows[0].n;
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("sign-up", () => {
  test("a learner gets a token and one SELF profile that is already active", async () => {
    const res = await signupLearner("ann@example.com");
    expect(res.status).toBe(201);

    const profile = await me(res.body.token);
    expect(profile.body.account).toMatchObject({ email: "ann@example.com", kind: "LEARNER" });
    expect(profile.body.profiles).toEqual([
      { id: expect.any(Number), kind: "SELF", nickname: "Ann", avatar: "lion", hasPin: false },
    ]);
    expect(profile.body.activeProfileId).toBe(profile.body.profiles[0].id);
  });

  test("a parent gets a token and no profiles of their own", async () => {
    const res = await signupParent("parent@example.com");
    expect(res.status).toBe(201);

    const profile = await me(res.body.token);
    expect(profile.body.profiles).toEqual([]);
    expect(profile.body.activeProfileId).toBeNull();
  });

  test("someone under 18 is refused and nothing is saved", async () => {
    const res = await signupLearner("kid@example.com", { birthYear: thisYear - 12 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "UNDER_AGE" });
    expect(await countAccounts("kid@example.com")).toBe(0);
  });

  test("age is this year minus birth year: 17 is refused, 18 is accepted", async () => {
    expect((await signupParent("age17@example.com", { birthYear: thisYear - 17 })).status).toBe(403);
    expect((await signupParent("age18@example.com", { birthYear: thisYear - 18 })).status).toBe(201);
  });

  test("an email already in use is refused, ignoring case and spaces", async () => {
    await signupParent("taken@example.com");
    const res = await signupParent("  TAKEN@example.com ");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "EMAIL_TAKEN" });
  });

  test("bad input gets a 400: short password, missing nickname, broken JSON", async () => {
    expect((await signupParent("short@example.com", { password: "1234567" })).status).toBe(400);
    expect((await signupLearner("nonick@example.com", { nickname: undefined })).status).toBe(400);
    const broken = await request(app).post("/auth/signup").set("Content-Type", "application/json").send("{not json");
    expect(broken.status).toBe(400);
  });

  test("stores an argon2id hash, never the password", async () => {
    await signupParent("hash@example.com");
    const [rows] = await db.pool.query<RowDataPacket[]>("SELECT password_hash FROM accounts WHERE email = ?", [
      "hash@example.com",
    ]);
    expect(rows[0].password_hash).toMatch(/^\$argon2id\$/);
    expect(rows[0].password_hash).not.toContain(PASSWORD);
  });
});

describe("sign-in and sign-out", () => {
  beforeAll(async () => {
    await signupLearner("bob@example.com");
  });

  test("the right password returns a working token; only its hash is stored", async () => {
    const res = await request(app).post("/auth/signin").send({ email: "bob@example.com", password: PASSWORD });
    expect(res.status).toBe(200);
    expect((await me(res.body.token)).status).toBe(200);

    const [rows] = await db.pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?", [
      hashToken(res.body.token),
    ]);
    expect(rows[0].n).toBe(1);
  });

  test("a wrong password and an unknown email get the same answer", async () => {
    const wrong = await request(app).post("/auth/signin").send({ email: "bob@example.com", password: "nope-nope" });
    const unknown = await request(app).post("/auth/signin").send({ email: "nobody@example.com", password: "nope-nope" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  test("after 10 failed tries the 11th is blocked, even with the right password", async () => {
    await signupParent("guess@example.com");
    for (let i = 0; i < 10; i++) {
      await request(app).post("/auth/signin").send({ email: "guess@example.com", password: "wrong-guess" });
    }
    const res = await request(app).post("/auth/signin").send({ email: "guess@example.com", password: PASSWORD });
    expect(res.status).toBe(429);
  });

  test("/me needs a valid token", async () => {
    expect((await request(app).get("/me")).status).toBe(401);
    expect((await me("made-up-token")).status).toBe(401);
  });

  test("an expired session no longer works", async () => {
    const [rows] = await db.pool.query<RowDataPacket[]>("SELECT id FROM accounts WHERE email = ?", ["bob@example.com"]);
    await db.pool.query(
      "INSERT INTO sessions (account_id, token_hash, expires_at) VALUES (?, ?, NOW() - INTERVAL 1 MINUTE)",
      [rows[0].id, hashToken("old-token")],
    );
    expect((await me("old-token")).status).toBe(401);
  });

  test("signing out ends the session", async () => {
    const { body } = await request(app).post("/auth/signin").send({ email: "bob@example.com", password: PASSWORD });
    const out = await request(app).post("/auth/signout").set("Authorization", `Bearer ${body.token}`);
    expect(out.status).toBe(204);
    expect((await me(body.token)).status).toBe(401);
  });
});
