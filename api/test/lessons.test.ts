import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { LESSON_IDS } from "../src/lessons/catalog.js";
import { freshTestDatabase, LEARNER_ONBOARDING, testDbSettings, usernameFor } from "./test-db.js";

const db = createDatabase(testDbSettings);
const app = createApp(db);
const PASSWORD = "lesson password";
const [FIRST, SECOND, THIRD] = LESSON_IDS;

async function signup(email: string, kind: "PARENT" | "LEARNER"): Promise<string> {
  const extra = kind === "LEARNER" ? { nickname: "Amina", avatar: "lion", ...LEARNER_ONBOARDING } : {};
  const res = await request(app)
    .post("/auth/signup")
    .send({ email, username: usernameFor(email), password: PASSWORD, birthYear: 1990, kind, ...extra });
  return res.body.token;
}

function as(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    complete: (lessonId: string) => request(app).post(`/lessons/${lessonId}/complete`).set(auth),
    me: () => request(app).get("/me").set(auth),
    addChild: (nickname: string) =>
      request(app)
        .post("/profiles")
        .set(auth)
        .send({ nickname, avatar: "zebra", level: "NEW", dailyGoalMinutes: 5, consent: true }),
    select: (id: number) => request(app).post(`/profiles/${id}/select`).set(auth).send({}),
    unlock: () => request(app).post("/parent/unlock").set(auth).send({ password: PASSWORD }),
  };
}

function completedOf(me: request.Response, profileId?: number): string[] {
  const profile = profileId ? me.body.profiles.find((p: { id: number }) => p.id === profileId) : me.body.profiles[0];
  return profile.completedLessons;
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("lesson progress", () => {
  test("a new learner has finished nothing", async () => {
    const learner = as(await signup("new@example.com", "LEARNER"));
    expect(completedOf(await learner.me())).toEqual([]);
  });

  test("finishing a lesson is saved, and finishing it again changes nothing", async () => {
    const learner = as(await signup("saved@example.com", "LEARNER"));
    expect((await learner.complete(FIRST)).status).toBe(204);
    expect((await learner.complete(FIRST)).status).toBe(204);
    expect(completedOf(await learner.me())).toEqual([FIRST]);
  });

  test("lessons open in order: lesson 3 is refused until lesson 2 is done", async () => {
    const learner = as(await signup("order@example.com", "LEARNER"));
    await learner.complete(FIRST);
    expect((await learner.complete(THIRD)).body.error).toBe("LESSON_LOCKED");
    expect((await learner.complete(SECOND)).status).toBe(204);
    expect((await learner.complete(THIRD)).status).toBe(204);
    expect(completedOf(await learner.me())).toEqual([FIRST, SECOND, THIRD]);
  });

  test("an unknown lesson is refused", async () => {
    const learner = as(await signup("unknown@example.com", "LEARNER"));
    expect((await learner.complete("not-a-lesson")).status).toBe(404);
  });

  test("each child has their own progress", async () => {
    const parent = as(await signup("family@example.com", "PARENT"));
    const keza = (await parent.addChild("Keza")).body.id;
    const ganza = (await parent.addChild("Ganza")).body.id;

    await parent.select(keza);
    await parent.complete(FIRST);
    await parent.unlock();

    const me = await parent.me();
    expect(completedOf(me, keza)).toEqual([FIRST]);
    expect(completedOf(me, ganza)).toEqual([]);
  });

  test("a parent with no child open cannot finish lessons", async () => {
    const parent = as(await signup("parentmode@example.com", "PARENT"));
    const res = await parent.complete(FIRST);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("NO_ACTIVE_PROFILE");
  });

  test("finishing a lesson needs a signed-in session", async () => {
    expect((await request(app).post(`/lessons/${FIRST}/complete`)).status).toBe(401);
  });
});
