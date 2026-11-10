import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { previousLesson } from "./catalog.js";

export function lessonRoutes(db: Database) {
  const router = Router();
  router.use("/lessons", requireSession(db));

  // Marks a lesson finished for the profile open on this phone.
  router.post("/lessons/:lessonId/complete", async (req, res) => {
    const session: SessionInfo = res.locals.session;
    const learnerId = session.activeLearnerId;
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }

    const { lessonId } = req.params;
    const previous = previousLesson(lessonId);
    if (previous === undefined) {
      res.status(404).json({ error: "LESSON_NOT_FOUND" });
      return;
    }
    if (previous !== null) {
      const [rows] = await db.pool.query<RowDataPacket[]>(
        "SELECT 1 FROM lesson_progress WHERE learner_id = ? AND lesson_id = ?",
        [learnerId, previous],
      );
      if (rows.length === 0) {
        res.status(409).json({ error: "LESSON_LOCKED" });
        return;
      }
    }

    // Doing a lesson again keeps the first finish time.
    await db.pool.query("INSERT IGNORE INTO lesson_progress (learner_id, lesson_id) VALUES (?, ?)", [
      learnerId,
      lessonId,
    ]);
    res.status(204).end();
  });

  return router;
}
