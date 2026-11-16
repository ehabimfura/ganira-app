import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, expect, test } from "vitest";
import { createSpeechClient } from "../src/speech/client.js";

// A stand-in speech service that remembers the headers it was sent. When the phrase is sent,
// it answers with a per-word fit, as the real service does.
let seen: IncomingHttpHeaders = {};
const service = createServer((req, res) => {
  seen = req.headers;
  req.resume();
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    const body = seen["x-expected"]
      ? { text: "muraho", words: [{ heard: true, gap: 0 }, { heard: false, gap: 4 }] }
      : { text: "muraho" };
    res.end(JSON.stringify(body));
  });
});
let url = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => service.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(service.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => service.close(() => resolve())));

test("the speech key is sent with every recording", async () => {
  const transcribe = createSpeechClient(url, "secret-key");
  expect((await transcribe(Buffer.from("audio"), "Muraho")).transcript).toBe("muraho");
  expect(seen["x-speech-key"]).toBe("secret-key");
});

test("without a key (on a laptop) no key header is sent", async () => {
  await createSpeechClient(url)(Buffer.from("audio"), "Muraho");
  expect(seen["x-speech-key"]).toBeUndefined();
});

test("the phrase is sent URL-encoded, and the per-word fit comes back", async () => {
  const answer = await createSpeechClient(url)(Buffer.from("audio"), "Muraho mwiriwe");
  expect(seen["x-expected"]).toBe("Muraho%20mwiriwe");
  expect(answer).toEqual({ transcript: "muraho", heard: [true, false] });
});
