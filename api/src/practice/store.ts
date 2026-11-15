import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import type { Database } from "../db.js";
import { FIRST_HALF_LIFE_HOURS, kigaliDay, nextHalfLife, recallChance, streakLength } from "./memory.js";

// One answered exercise: the phrase (its Kinyarwanda text) and whether it was right.
export const resultSchema = z.object({
  phrase: z.string().trim().min(1).max(80),
  correct: z.boolean(),
});
export type PracticeResult = z.infer<typeof resultSchema>;

// A phrase is due for review once the chance of recalling it drops below this.
const DUE_BELOW = 0.75;
const REVIEW_SIZE = 8;
const HOUR_MS = 60 * 60 * 1000;

// Counts today for the streak and updates how well each phrase is remembered.
export async function recordPractice(db: Database, learnerId: number, results: PracticeResult[], now: Date) {
  await db.pool.query("INSERT IGNORE INTO learning_days (learner_id, day) VALUES (?, ?)", [learnerId, kigaliDay(now)]);
  if (results.length === 0) return;

  const phrases = [...new Set(results.map((r) => r.phrase))];
  const [rows] = await db.pool.query<RowDataPacket[]>(
    "SELECT phrase, half_life_hours FROM phrase_memory WHERE learner_id = ? AND phrase IN (?)",
    [learnerId, phrases],
  );
  const halfLife = new Map(rows.map((r) => [r.phrase as string, Number(r.half_life_hours)]));
  for (const { phrase, correct } of results) {
    const next = nextHalfLife(halfLife.get(phrase) ?? FIRST_HALF_LIFE_HOURS, correct);
    halfLife.set(phrase, next);
    await db.pool.query(
      `INSERT INTO phrase_memory (learner_id, phrase, half_life_hours, last_practised_at, right_count, wrong_count)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE half_life_hours = VALUES(half_life_hours), last_practised_at = VALUES(last_practised_at),
         right_count = right_count + VALUES(right_count), wrong_count = wrong_count + VALUES(wrong_count)`,
      [learnerId, phrase, next, now, correct ? 1 : 0, correct ? 0 : 1],
    );
  }
}

// The phrases most likely forgotten, weakest first.
export async function dueForReview(db: Database, learnerId: number, now: Date) {
  const [rows] = await db.pool.query<RowDataPacket[]>(
    "SELECT phrase, half_life_hours, last_practised_at FROM phrase_memory WHERE learner_id = ?",
    [learnerId],
  );
  return rows
    .map((r) => ({
      phrase: r.phrase as string,
      recall: recallChance(Number(r.half_life_hours), (now.getTime() - new Date(r.last_practised_at).getTime()) / HOUR_MS),
    }))
    .filter((p) => p.recall < DUE_BELOW)
    .sort((a, b) => a.recall - b.recall)
    .slice(0, REVIEW_SIZE)
    .map((p) => ({ phrase: p.phrase, recall: Math.round(p.recall * 100) / 100 }));
}

// Each profile's streak, for /me.
export async function streaksFor(db: Database, accountId: number, now: Date) {
  const [rows] = await db.pool.query<RowDataPacket[]>(
    `SELECT d.learner_id, DATE_FORMAT(d.day, '%Y-%m-%d') AS day
       FROM learning_days d JOIN learners l ON l.id = d.learner_id WHERE l.account_id = ?`,
    [accountId],
  );
  const today = kigaliDay(now);
  return (learnerId: number) => {
    const days = rows.filter((r) => r.learner_id === learnerId).map((r) => r.day as string);
    return { days: streakLength(days, today), practisedToday: days.includes(today) };
  };
}
