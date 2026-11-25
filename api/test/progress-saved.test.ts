import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { LESSON_IDS } from "../src/lessons/catalog.js";
import { freshTestDatabase, LEARNER_ONBOARDING, testDbSettings, usernameFor } from "./test-db.js";

const db = createDatabase(testDbSettings);
const app = createApp(db);
const PASSWORD = "progress password";
const [FIRST] = LESSON_IDS;

async function signupLearner(email: string): Promise<string> {
  const res = await request(app)
    .post("/auth/signup")
    .send({
      email,
      username: usernameFor(email),
      password: PASSWORD,
      birthYear: 1990,
      kind: "LEARNER",
      nickname: "Amina",
      avatar: "lion",
      ...LEARNER_ONBOARDING,
    });
  return res.body.token;
}

function as(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    progress: () => request(app).get("/progress").set(auth),
    complete: (lessonId: string, body: object = {}) =>
      request(app).post(`/lessons/${lessonId}/complete`).set(auth).send(body),
    saved: () => request(app).get("/saved").set(auth),
    save: (kind: string, ref: string) => request(app).put(`/saved/${kind}/${encodeURIComponent(ref)}`).set(auth),
    unsave: (kind: string, ref: string) => request(app).delete(`/saved/${kind}/${encodeURIComponent(ref)}`).set(auth),
  };
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("progress screen", () => {
  test("a new learner has no minutes, lessons or phrases", async () => {
    const body = (await as(await signupLearner("progress-new@example.com")).progress()).body;
    expect(body).toMatchObject({
      streakDays: 0,
      minutesPractised: 0,
      lessonsDone: 0,
      lessonsTotal: LESSON_IDS.length,
      phrasesLearned: 0,
    });
  });

  test("minutes come from the time sent with a finished lesson, and phrases learned from its answers", async () => {
    const learner = as(await signupLearner("progress-used@example.com"));
    await learner.complete(FIRST, { seconds: 150, results: [{ phrase: "Muraho", correct: true }] });
    const body = (await learner.progress()).body;
    expect(body).toMatchObject({ streakDays: 1, practisedToday: true, minutesPractised: 3, lessonsDone: 1, phrasesLearned: 1 });
  });

  test("time outside the limit is refused", async () => {
    const learner = as(await signupLearner("progress-bad@example.com"));
    expect((await learner.complete(FIRST, { seconds: 99999 })).status).toBe(400);
  });
});

describe("saved phrases and lessons", () => {
  test("save, list and remove a lesson", async () => {
    const learner = as(await signupLearner("saved-lesson@example.com"));
    expect((await learner.save("lesson", FIRST)).status).toBe(204);
    expect((await learner.saved()).body.lessons).toEqual([FIRST]);
    expect((await learner.unsave("lesson", FIRST)).status).toBe(204);
    expect((await learner.saved()).body.lessons).toEqual([]);
  });

  test("a phrase with spaces and punctuation is saved as written", async () => {
    const learner = as(await signupLearner("saved-phrase@example.com"));
    await learner.save("phrase", "Muraho, nitwa Daisy");
    expect((await learner.saved()).body.phrases).toEqual(["Muraho, nitwa Daisy"]);
  });

  test("an unknown lesson or kind is refused", async () => {
    const learner = as(await signupLearner("saved-bad@example.com"));
    expect((await learner.save("lesson", "not-a-lesson")).status).toBe(400);
    expect((await learner.save("video", "x")).status).toBe(400);
  });

  test("saving the same item twice keeps one copy", async () => {
    const learner = as(await signupLearner("saved-twice@example.com"));
    await learner.save("phrase", "Yego");
    await learner.save("phrase", "Yego");
    expect((await learner.saved()).body.phrases).toEqual(["Yego"]);
  });
});
