import { Router } from "express";
import { z } from "zod";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { dueForReview, recordPractice, resultSchema } from "./store.js";

const practiceSchema = z.object({ results: z.array(resultSchema).min(1).max(60) });

export function practiceRoutes(db: Database, now: () => Date) {
  const router = Router();
  router.use("/practice", requireSession(db));

  const learnerOf = (session: SessionInfo) => session.activeLearnerId;

  // The answers from a finished daily review.
  router.post("/practice/results", async (req, res) => {
    const learnerId = learnerOf(res.locals.session);
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    const parsed = practiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    await recordPractice(db, learnerId, parsed.data.results, now());
    res.status(204).end();
  });

  // The phrases to bring back today, weakest first.
  router.get("/practice/review", async (_req, res) => {
    const learnerId = learnerOf(res.locals.session);
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    res.json({ due: await dueForReview(db, learnerId, now()) });
  });

  return router;
}
