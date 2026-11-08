import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import type { Database } from "../db.js";
import { hashToken, sessionExpiry } from "./tokens.js";

export interface SessionInfo {
  sessionId: number;
  accountId: number;
  accountKind: "PARENT" | "LEARNER";
  activeLearnerId: number | null;
}

// Routes after this middleware can read the signed-in session from res.locals.session.
export function requireSession(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token) {
      res.status(401).json({ error: "NOT_SIGNED_IN" });
      return;
    }

    const [rows] = await db.pool.query<RowDataPacket[]>(
      `SELECT s.id, s.account_id, s.active_learner_id, a.kind
         FROM sessions s JOIN accounts a ON a.id = s.account_id
        WHERE s.token_hash = ? AND s.expires_at > NOW()`,
      [hashToken(token)],
    );
    const row = rows[0];
    if (!row) {
      res.status(401).json({ error: "NOT_SIGNED_IN" });
      return;
    }

    // Each use pushes the expiry 30 days forward, so active learners stay signed in.
    await db.pool.query("UPDATE sessions SET expires_at = ? WHERE id = ?", [sessionExpiry(), row.id]);

    const session: SessionInfo = {
      sessionId: row.id,
      accountId: row.account_id,
      accountKind: row.kind,
      activeLearnerId: row.active_learner_id,
    };
    res.locals.session = session;
    next();
  };
}
