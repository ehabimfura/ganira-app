import express from "express";
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

  return app;
}
