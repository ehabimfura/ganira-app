import express, { Router } from "express";
import { z } from "zod";
import { createRateLimiter } from "../auth/rate-limit.js";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { UnreadableAudioError, type Transcribe } from "./client.js";
import { matchWords } from "./match.js";

// A 10-second phone recording is well under 1 MB; base64 makes it about a third bigger.
export const MAX_UPLOAD = "2mb";
const CHECKS_PER_MINUTE = 60;

const checkSchema = z.object({
  expected: z.string().trim().min(1).max(200),
  audio: z.base64().min(1),
});

export function speechRoutes(db: Database, transcribe: Transcribe) {
  const router = Router();
  // Each check costs the server real work, so one account can't flood it.
  const limiter = createRateLimiter(CHECKS_PER_MINUTE, 60 * 1000);
  const signedIn = requireSession(db);
  // The first lesson comes before sign-up, so a session is optional here. A token that is
  // sent must still be valid. Signed-out checks are counted per network address instead.
  const optionalSession: express.RequestHandler = (req, res, next) =>
    req.get("authorization") ? signedIn(req, res, next) : next();
  router.use("/speech", express.json({ limit: MAX_UPLOAD }), optionalSession);

  router.post("/speech/check", async (req, res) => {
    const session: SessionInfo | undefined = res.locals.session;
    const limitKey = session ? `account:${session.accountId}` : `ip:${req.ip}`;
    if (!limiter.tryAttempt(limitKey)) {
      res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
      return;
    }
    const parsed = checkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }

    let transcript: string;
    const started = Date.now();
    try {
      transcript = await transcribe(Buffer.from(parsed.data.audio, "base64"));
      // Timing only: the transcript is a child's speech and is never logged.
      console.info(`Speech check answered in ${Date.now() - started} ms`);
    } catch (error) {
      console.info(`Speech check failed after ${Date.now() - started} ms`);
      if (error instanceof UnreadableAudioError) {
        res.status(400).json({ error: "AUDIO_UNREADABLE" });
        return;
      }
      console.error("Speech check failed", error);
      res.status(503).json({ error: "SPEECH_UNAVAILABLE" });
      return;
    }

    const words = matchWords(parsed.data.expected, transcript);
    res.json({ words, allHeard: words.every((w) => w.heard), transcript });
  });

  return router;
}
