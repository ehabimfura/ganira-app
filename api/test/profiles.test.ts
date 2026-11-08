import type { RowDataPacket } from "mysql2/promise";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { MAX_CHILDREN } from "../src/profiles/routes.js";
import { freshTestDatabase, testDbSettings } from "./test-db.js";

const db = createDatabase(testDbSettings);
const app = createApp(db);
const PASSWORD = "parent password";

async function signupParent(email: string): Promise<string> {
  const res = await request(app)
    .post("/auth/signup")
    .send({ email, password: PASSWORD, birthYear: 1985, kind: "PARENT" });
  return res.body.token;
}

function as(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    addChild: (body: Record<string, unknown>) =>
      request(app).post("/profiles").set(auth).send({ nickname: "Keza", avatar: "giraffe", consent: true, ...body }),
    select: (id: number, body: Record<string, unknown> = {}) =>
      request(app).post(`/profiles/${id}/select`).set(auth).send(body),
    setPin: (id: number, pin: string | null) => request(app).put(`/profiles/${id}/pin`).set(auth).send({ pin }),
    unlock: (password: string) => request(app).post("/parent/unlock").set(auth).send({ password }),
    me: () => request(app).get("/me").set(auth),
  };
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("child profiles", () => {
  let parent: ReturnType<typeof as>;

  beforeAll(async () => {
    parent = as(await signupParent("mama@example.com"));
  });

  test("a parent adds a child, and the consent is recorded", async () => {
    const res = await parent.addChild({ ageRange: "6-9" });
    expect(res.status).toBe(201);

    const [rows] = await db.pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM parental_consents WHERE learner_id = ?", [
      res.body.id,
    ]);
    expect(rows[0].n).toBe(1);
    expect((await parent.me()).body.profiles).toEqual([
      { id: res.body.id, kind: "CHILD", nickname: "Keza", avatar: "giraffe", hasPin: false },
    ]);
  });

  test("no consent, no child", async () => {
    expect((await parent.addChild({ consent: false })).status).toBe(400);
    expect((await parent.addChild({ consent: undefined })).status).toBe(400);
  });

  test("a PIN must be exactly 4 digits", async () => {
    expect((await parent.addChild({ pin: "12a4" })).status).toBe(400);
    expect((await parent.addChild({ pin: "12345" })).status).toBe(400);
  });

  test("a learner account cannot add children", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "solo@example.com", password: PASSWORD, birthYear: 1990, kind: "LEARNER", nickname: "Sam", avatar: "lion" });
    expect((await as(res.body.token).addChild({})).status).toBe(403);
  });

  test(`a parent can have at most ${MAX_CHILDREN} children`, async () => {
    const big = as(await signupParent("big-family@example.com"));
    for (let i = 0; i < MAX_CHILDREN; i++) expect((await big.addChild({ nickname: `Child ${i}` })).status).toBe(201);
    expect((await big.addChild({ nickname: "One more" })).status).toBe(409);
  });
});

describe("switching between parent and child", () => {
  let parent: ReturnType<typeof as>;
  let noPinId: number;
  let pinId: number;

  beforeAll(async () => {
    parent = as(await signupParent("papa@example.com"));
    noPinId = (await parent.addChild({ nickname: "Ganza" })).body.id;
    pinId = (await parent.addChild({ nickname: "Ineza", pin: "2468" })).body.id;
  });

  test("a child without a PIN opens with one tap", async () => {
    const res = await parent.select(noPinId);
    expect(res.status).toBe(200);
    expect((await parent.me()).body.activeProfileId).toBe(noPinId);
  });

  test("in child mode, parent-only actions are refused", async () => {
    expect((await parent.addChild({ nickname: "Sneaky" })).status).toBe(403);
    expect((await parent.setPin(noPinId, "1111")).status).toBe(403);
  });

  test("the parent's password returns to parent mode; a wrong one does not", async () => {
    expect((await parent.unlock("wrong password")).status).toBe(401);
    expect((await parent.me()).body.activeProfileId).toBe(noPinId);

    expect((await parent.unlock(PASSWORD)).status).toBe(200);
    expect((await parent.me()).body.activeProfileId).toBeNull();
  });

  test("a PIN-locked child needs the right PIN", async () => {
    expect((await parent.select(pinId)).status).toBe(401);
    expect((await parent.select(pinId, { pin: "0000" })).status).toBe(401);
    expect((await parent.select(pinId, { pin: "2468" })).status).toBe(200);
    await parent.unlock(PASSWORD);
  });

  test("the parent can set and remove a PIN", async () => {
    expect((await parent.setPin(noPinId, "1357")).status).toBe(204);
    expect((await parent.select(noPinId)).status).toBe(401);
    expect((await parent.select(noPinId, { pin: "1357" })).status).toBe(200);
    await parent.unlock(PASSWORD);

    expect((await parent.setPin(noPinId, null)).status).toBe(204);
    expect((await parent.select(noPinId)).status).toBe(200);
    await parent.unlock(PASSWORD);
  });

  test("after 5 wrong PINs the profile is locked for a while", async () => {
    const lockedId = (await parent.addChild({ nickname: "Teta", pin: "9999" })).body.id;
    for (let i = 0; i < 5; i++) await parent.select(lockedId, { pin: "0000" });
    expect((await parent.select(lockedId, { pin: "9999" })).status).toBe(429);
  });

  test("another family's child cannot be opened", async () => {
    const stranger = as(await signupParent("stranger@example.com"));
    expect((await stranger.select(noPinId)).status).toBe(404);
    expect((await stranger.setPin(noPinId, "1234")).status).toBe(404);
  });

  test("everything here needs a signed-in session", async () => {
    expect((await request(app).post("/profiles").send({})).status).toBe(401);
    expect((await request(app).post(`/profiles/${noPinId}/select`).send({})).status).toBe(401);
  });
});
