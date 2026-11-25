import { Router } from "express";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { progressFor } from "./summary.js";

// What the progress screen shows for the profile open on this phone (FR 9.1).
export function progressRoutes(db: Database, now: () => Date) {
  const router = Router();
  router.use("/progress", requireSession(db));

  router.get("/progress", async (_req, res) => {
    const learnerId = (res.locals.session as SessionInfo).activeLearnerId;
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    res.json(await progressFor(db, learnerId, now()));
  });

  return router;
}
