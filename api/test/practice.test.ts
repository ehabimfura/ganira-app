import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { LESSON_IDS } from "../src/lessons/catalog.js";
import { freshTestDatabase, LEARNER_ONBOARDING, testDbSettings, usernameFor } from "./test-db.js";

const db = createDatabase(testDbSettings);
// The tests move this clock forward instead of waiting hours.
let clock = new Date("2026-11-15T08:00:00Z");
const app = createApp(db, { now: () => clock });
const HOUR = 60 * 60 * 1000;
const later = (hours: number) => {
  clock = new Date(clock.getTime() + hours * HOUR);
};

async function learner(email: string) {
  const res = await request(app)
    .post("/auth/signup")
    .send({ email, username: usernameFor(email), password: "practice password", birthYear: 1990, kind: "LEARNER", nickname: "Amina", avatar: "lion", ...LEARNER_ONBOARDING });
  const auth = { Authorization: `Bearer ${res.body.token}` };
  return {
    complete: (lessonId: string, results?: unknown) =>
      request(app).post(`/lessons/${lessonId}/complete`).set(auth).send(results === undefined ? {} : { results }),
    practise: (results: unknown) => request(app).post("/practice/results").set(auth).send({ results }),
    review: () => request(app).get("/practice/review").set(auth),
    streak: async () => (await request(app).get("/me").set(auth)).body.profiles[0].streak,
  };
}

beforeAll(freshTestDatabase);
afterAll(() => db.close());

describe("daily streak", () => {
  test("finishing a level counts today; the streak grows day by day and breaks after a missed day", async () => {
    clock = new Date("2026-11-15T08:00:00Z");
    const amina = await learner("streak@example.com");
    expect(await amina.streak()).toEqual({ days: 0, practisedToday: false });

    expect((await amina.complete(LESSON_IDS[0])).status).toBe(204);
    expect(await amina.streak()).toEqual({ days: 1, practisedToday: true });

    later(24); // the next day: the streak holds until the day ends
    expect(await amina.streak()).toEqual({ days: 1, practisedToday: false });
    expect((await amina.practise([{ phrase: "Muraho", correct: true }])).status).toBe(204);
    expect(await amina.streak()).toEqual({ days: 2, practisedToday: true });

    later(48); // a whole day missed
    expect(await amina.streak()).toEqual({ days: 0, practisedToday: false });
  });
});

describe("spaced review", () => {
  test("nothing is due straight after practice", async () => {
    clock = new Date("2026-11-15T08:00:00Z");
    const amina = await learner("fresh@example.com");
    await amina.complete(LESSON_IDS[0], [{ phrase: "Muraho", correct: true }]);
    expect((await amina.review()).body).toEqual({ due: [] });
  });

  test("a phrase answered wrongly comes back first, before a phrase answered right", async () => {
    clock = new Date("2026-11-15T08:00:00Z");
    const amina = await learner("review@example.com");
    await amina.complete(LESSON_IDS[0], [
      { phrase: "Muraho", correct: true },
      { phrase: "Mwiriwe", correct: false },
    ]);
    later(24);
    const { due } = (await amina.review()).body;
    expect(due.map((d: { phrase: string }) => d.phrase)).toEqual(["Mwiriwe", "Muraho"]);
    expect(due[0].recall).toBeLessThan(due[1].recall);
  });

  test("answering right in the review pushes the phrase further away", async () => {
    clock = new Date("2026-11-15T08:00:00Z");
    const amina = await learner("again@example.com");
    await amina.complete(LESSON_IDS[0], [{ phrase: "Mwiriwe", correct: false }]);
    later(24);
    expect((await amina.review()).body.due).toHaveLength(1);
    await amina.practise([{ phrase: "Mwiriwe", correct: true }]);
    expect((await amina.review()).body.due).toEqual([]);
  });

  test("results are checked: a phrase must be short text and correct must be true or false", async () => {
    const amina = await learner("bad@example.com");
    expect((await amina.practise([{ phrase: "x".repeat(81), correct: true }])).status).toBe(400);
    expect((await amina.practise([{ phrase: "Muraho", correct: "yes" }])).status).toBe(400);
    expect((await amina.practise([])).status).toBe(400);
  });

  test("the review needs a signed-in learner", async () => {
    expect((await request(app).get("/practice/review")).status).toBe(401);
  });
});
