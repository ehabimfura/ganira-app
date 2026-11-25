import express, { type NextFunction, type Request, type Response } from "express";
import { authRoutes } from "./auth/routes.js";
import type { Database } from "./db.js";
import { lessonRoutes } from "./lessons/routes.js";
import { practiceRoutes } from "./practice/routes.js";
import { progressRoutes } from "./progress/routes.js";
import { savedRoutes } from "./saved/routes.js";
import { profileRoutes } from "./profiles/routes.js";
import { noSpeechService, type Transcribe } from "./speech/client.js";
import { speechRoutes } from "./speech/routes.js";

export interface AppOptions {
  // Browser origins allowed to call the API. Phones don't need this; only the
  // web build used for testing on a laptop does. Empty means no browser access.
  corsOrigins?: string[];
  // Turns a recording into text (the speech service). Without it, speech checks answer "unavailable".
  transcribe?: Transcribe;
  // The current time; tests move it forward to check streaks and reviews.
  now?: () => Date;
}

export function createApp(db: Database, { corsOrigins = [], transcribe = noSpeechService, now = () => new Date() }: AppOptions = {}) {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && corsOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  // Speech uploads are larger than other requests, so they get their own body size limit.
  app.use(speechRoutes(db, transcribe));
  app.use(express.json());

  // Proves the whole path works: phone -> API -> MySQL -> back.
  app.get("/health", async (_req, res) => {
    try {
      await db.ping();
      res.json({ status: "ok", database: "ok" });
    } catch (error) {
      console.error("Health check: database unreachable", error);
      res.status(503).json({ status: "degraded", database: "down" });
    }
  });

  app.use(authRoutes(db, now));
  app.use(profileRoutes(db));
  app.use(lessonRoutes(db, now));
  app.use(practiceRoutes(db, now));
  app.use(progressRoutes(db, now));
  app.use(savedRoutes(db));

  // Anything unexpected: log the details here, send the phone a plain message.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if ((error as { type?: string }).type === "entity.too.large") {
      res.status(413).json({ error: "RECORDING_TOO_LONG" });
      return;
    }
    if ((error as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    console.error("Unhandled API error", error);
    res.status(500).json({ error: "SERVER_ERROR" });
  });

  return app;
}
