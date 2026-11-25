import type { RowDataPacket } from "mysql2/promise";
import type { Database } from "../db.js";
import { LESSON_IDS } from "../lessons/catalog.js";
import { kigaliDay, streakLength } from "../practice/memory.js";

// One profile's progress: what the progress screen and the parent view both show (FR 9.1, FR 10.1).
export async function progressFor(db: Database, learnerId: number, now: Date) {
  const [days] = await db.pool.query<RowDataPacket[]>(
    "SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, seconds FROM learning_days WHERE learner_id = ?",
    [learnerId],
  );
  const [lessons] = await db.pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM lesson_progress WHERE learner_id = ?",
    [learnerId],
  );
  const [phrases] = await db.pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM phrase_memory WHERE learner_id = ? AND right_count > 0",
    [learnerId],
  );

  const today = kigaliDay(now);
  const dayStrings = days.map((d) => d.day as string);
  const seconds = days.reduce((sum, d) => sum + Number(d.seconds), 0);
  return {
    streakDays: streakLength(dayStrings, today),
    practisedToday: dayStrings.includes(today),
    minutesPractised: Math.round(seconds / 60),
    lessonsDone: Number(lessons[0].n),
    lessonsTotal: LESSON_IDS.length,
    phrasesLearned: Number(phrases[0].n),
  };
}
