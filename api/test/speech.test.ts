import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
import { UnreadableAudioError, type Transcribe } from "../src/speech/client.js";
import { freshTestDatabase, LEARNER_ONBOARDING, testDbSettings } from "./test-db.js";

const db = createDatabase(testDbSettings);
const AUDIO = Buffer.from("pretend this is a recording").toString("base64");

// The real speech service is a separate program; these tests swap in a stand-in.
let nextTranscript: Transcribe = async () => ({ transcript: "muraho" });
let received: Buffer | null = null;
let receivedPhrase = "";
const app = createApp(db, {
  transcribe: async (audio, expected) => {
    received = audio;
    receivedPhrase = expected;
    return nextTranscript(audio, expected);
  },
});

let token = "";
const check = (body: Record<string, unknown>) =>
  request(app).post("/speech/check").set({ Authorization: `Bearer ${token}` }).send(body);

beforeAll(async () => {
  await freshTestDatabase();
  const res = await request(app).post("/auth/signup").send({
    email: "speaker@example.com",
    username: "speaker",
    password: "speaker password",
    birthYear: 1990,
    kind: "LEARNER",
    nickname: "Amina",
    avatar: "lion",
    ...LEARNER_ONBOARDING,
  });
  token = res.body.token;
});
afterAll(() => db.close());

describe("speech check", () => {
  test("the recording reaches the speech service, and the answer says which words were heard", async () => {
    nextTranscript = async () => ({ transcript: "muraho" });
    const res = await check({ expected: "Muraho", audio: AUDIO });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ words: [{ word: "Muraho", heard: true }], allHeard: true, transcript: "muraho" });
    expect(received?.toString()).toBe("pretend this is a recording");
    expect(receivedPhrase).toBe("Muraho");
  });

  test("the speech service's per-word fit decides which words were heard, even if the text differs", async () => {
    nextTranscript = async () => ({ transcript: "egemera kuri", heard: [true, false] });
    const res = await check({ expected: "Remera kuri", audio: AUDIO });
    expect(res.body.words).toEqual([
      { word: "Remera", heard: true },
      { word: "kuri", heard: false },
    ]);
    expect(res.body.allHeard).toBe(false);
  });

  test("some words heard is not allHeard", async () => {
    nextTranscript = async () => ({ transcript: "bite" });
    const res = await check({ expected: "Bite se", audio: AUDIO });
    expect(res.body.allHeard).toBe(false);
    expect(res.body.words).toEqual([
      { word: "Bite", heard: true },
      { word: "se", heard: false },
    ]);
  });

  test("a recording the service can't read gets AUDIO_UNREADABLE", async () => {
    nextTranscript = async () => {
      throw new UnreadableAudioError();
    };
    const res = await check({ expected: "Muraho", audio: AUDIO });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("AUDIO_UNREADABLE");
  });

  test("if the speech service is down, the phone gets SPEECH_UNAVAILABLE", async () => {
    nextTranscript = async () => {
      throw new Error("connect ECONNREFUSED");
    };
    const res = await check({ expected: "Muraho", audio: AUDIO });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("SPEECH_UNAVAILABLE");
  });

  test("missing audio, audio that isn't base64, or an empty phrase is refused", async () => {
    expect((await check({ expected: "Muraho" })).status).toBe(400);
    expect((await check({ expected: "Muraho", audio: "not base64!" })).status).toBe(400);
    expect((await check({ expected: " ", audio: AUDIO })).status).toBe(400);
  });

  test("a recording up to about a megabyte is accepted, larger ones are refused", async () => {
    nextTranscript = async () => ({ transcript: "muraho" });
    const big = Buffer.alloc(900_000).toString("base64");
    expect((await check({ expected: "Muraho", audio: big })).status).toBe(200);
    const huge = Buffer.alloc(3_000_000).toString("base64");
    expect((await check({ expected: "Muraho", audio: huge })).status).toBe(413);
  });

  test("the first lesson works before sign-up, so no session is needed", async () => {
    nextTranscript = async () => ({ transcript: "muraho" });
    const res = await request(app).post("/speech/check").send({ expected: "Muraho", audio: AUDIO });
    expect(res.status).toBe(200);
    expect(res.body.allHeard).toBe(true);
  });

  test("a session token that doesn't work is still refused", async () => {
    const res = await request(app)
      .post("/speech/check")
      .set({ Authorization: "Bearer not-a-real-token" })
      .send({ expected: "Muraho", audio: AUDIO });
    expect(res.status).toBe(401);
  });
});
