import express, { type NextFunction, type Request, type Response } from "express";
import { authRoutes } from "./auth/routes.js";
import type { Database } from "./db.js";

export function createApp(db: Database) {
  const app = express();
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

  app.use(authRoutes(db));

  // Anything unexpected: log the details here, send the phone a plain message.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if ((error as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    console.error("Unhandled API error", error);
    res.status(500).json({ error: "SERVER_ERROR" });
  });

  return app;
}
