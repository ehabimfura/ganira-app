import { Router, type Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { requireSession, type SessionInfo } from "../auth/session.js";
import type { Database } from "../db.js";
import { LESSON_IDS } from "../lessons/catalog.js";

const KINDS = ["lesson", "phrase"] as const;
type Kind = (typeof KINDS)[number];
const MAX_REF = 80;

// Lessons and phrases a learner saves to practise again (FR 8).
export function savedRoutes(db: Database) {
  const router = Router();
  router.use("/saved", requireSession(db));

  const learnerOf = (res: Response) => (res.locals.session as SessionInfo).activeLearnerId;

  // Which ref is valid for the kind: a known lesson id, or any phrase of up to 80 characters.
  const validRef = (kind: Kind, ref: string) =>
    kind === "lesson" ? (LESSON_IDS as readonly string[]).includes(ref) : ref.trim().length > 0 && ref.length <= MAX_REF;

  router.get("/saved", async (_req, res) => {
    const learnerId = learnerOf(res);
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    const [rows] = await db.pool.query<RowDataPacket[]>(
      "SELECT kind, ref FROM saved_items WHERE learner_id = ? ORDER BY saved_at DESC",
      [learnerId],
    );
    res.json({
      lessons: rows.filter((r) => r.kind === "lesson").map((r) => r.ref as string),
      phrases: rows.filter((r) => r.kind === "phrase").map((r) => r.ref as string),
    });
  });

  router.put("/saved/:kind/:ref", async (req, res) => {
    const learnerId = learnerOf(res);
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    const kind = req.params.kind as Kind;
    if (!KINDS.includes(kind) || !validRef(kind, req.params.ref)) {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    await db.pool.query("INSERT IGNORE INTO saved_items (learner_id, kind, ref) VALUES (?, ?, ?)", [
      learnerId,
      kind,
      req.params.ref,
    ]);
    res.status(204).end();
  });

  router.delete("/saved/:kind/:ref", async (req, res) => {
    const learnerId = learnerOf(res);
    if (learnerId === null) {
      res.status(403).json({ error: "NO_ACTIVE_PROFILE" });
      return;
    }
    await db.pool.query("DELETE FROM saved_items WHERE learner_id = ? AND kind = ? AND ref = ?", [
      learnerId,
      req.params.kind,
      req.params.ref,
    ]);
    res.status(204).end();
  });

  return router;
}
