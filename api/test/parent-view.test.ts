import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { freshTestDatabase, LEARNER_ONBOARDING, testDbSettings, usernameFor } from "./test-db.js";

const db = createDatabase(testDbSettings);
const app = createApp(db);
const PASSWORD = "parent view password";

async function signup(email: string, kind: "PARENT" | "LEARNER"): Promise<string> {
  const extra = kind === "LEARNER" ? { nickname: "Amina", avatar: "lion", ...LEARNER_ONBOARDING } : {};
  const res = await request(app)
    .post("/auth/signup")
    .send({ email, username: usernameFor(email), password: PASSWORD, birthYear: 1990, kind, ...extra });
  return res.body.token;
}

function parent(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    addChild: (nickname: string) =>
      request(app)
        .post("/profiles")
        .set(auth)
        .send({ nickname, avatar: "zebra", level: "NEW", dailyGoalMinutes: 5, consent: true }),
    childProgress: (id: number) => request(app).get(`/profiles/${id}/progress`).set(auth),
    changeSettings: (id: number, body: object) =>
      request(app).patch(`/profiles/${id}/settings`).set(auth).send(body),
  };
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("parent view of a child", () => {
  test("a parent sees their child's progress and settings", async () => {
    const token = await signup("pv-parent@example.com", "PARENT");
    const p = parent(token);
    const { id } = (await p.addChild("Keza")).body;
    const res = await p.childProgress(id);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: "Keza", dailyGoalMinutes: 5, reminderTime: null, lessonsDone: 0 });
  });

  test("a parent changes the daily goal and reminder time", async () => {
    const p = parent(await signup("pv-change@example.com", "PARENT"));
    const { id } = (await p.addChild("Ineza")).body;
    expect((await p.changeSettings(id, { dailyGoalMinutes: 15, reminderTime: "17:30" })).status).toBe(204);
    expect((await p.childProgress(id)).body).toMatchObject({ dailyGoalMinutes: 15, reminderTime: "17:30" });
    expect((await p.changeSettings(id, { reminderTime: null })).status).toBe(204);
    expect((await p.childProgress(id)).body.reminderTime).toBeNull();
  });

  test("a goal outside 5, 10 or 15 minutes, a bad time, or an empty change is refused", async () => {
    const p = parent(await signup("pv-bad@example.com", "PARENT"));
    const { id } = (await p.addChild("Uwase")).body;
    expect((await p.changeSettings(id, { dailyGoalMinutes: 7 })).status).toBe(400);
    expect((await p.changeSettings(id, { reminderTime: "25:00" })).status).toBe(400);
    expect((await p.changeSettings(id, {})).status).toBe(400);
  });

  test("a parent cannot see or change another family's child", async () => {
    const owner = parent(await signup("pv-owner@example.com", "PARENT"));
    const { id } = (await owner.addChild("Mugisha")).body;
    const stranger = parent(await signup("pv-stranger@example.com", "PARENT"));
    expect((await stranger.childProgress(id)).status).toBe(404);
    expect((await stranger.changeSettings(id, { dailyGoalMinutes: 10 })).status).toBe(404);
  });

  test("a child account cannot use the parent view", async () => {
    const child = parent(await signup("pv-kid@example.com", "LEARNER"));
    expect((await child.childProgress(1)).status).toBe(403);
  });
});
