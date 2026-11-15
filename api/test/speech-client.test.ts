import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, expect, test } from "vitest";
import { createSpeechClient } from "../src/speech/client.js";

// A stand-in speech service that remembers the headers it was sent.
let seen: IncomingHttpHeaders = {};
const service = createServer((req, res) => {
  seen = req.headers;
  req.resume();
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ text: "muraho" }));
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
  expect(await transcribe(Buffer.from("audio"))).toBe("muraho");
  expect(seen["x-speech-key"]).toBe("secret-key");
});

test("without a key (on a laptop) no key header is sent", async () => {
  await createSpeechClient(url)(Buffer.from("audio"));
  expect(seen["x-speech-key"]).toBeUndefined();
});
