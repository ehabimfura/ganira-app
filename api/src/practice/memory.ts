// How well each learner remembers each phrase, and their daily streak.
//
// Memory follows half-life regression (Settles & Meeder, 2016, the model behind Duolingo's
// practice): each phrase has a half-life, the time after which the learner has an even
// chance of recalling it. The chance now is 2^(-hours since practice / half-life).
// A right answer doubles the half-life and a wrong one halves it.

export const FIRST_HALF_LIFE_HOURS = 12;
const MIN_HALF_LIFE_HOURS = 1;
const MAX_HALF_LIFE_HOURS = 24 * 365;

export function recallChance(halfLifeHours: number, hoursSincePractice: number): number {
  return 2 ** (-hoursSincePractice / halfLifeHours);
}

export function nextHalfLife(halfLifeHours: number, correct: boolean): number {
  const next = correct ? halfLifeHours * 2 : halfLifeHours / 2;
  return Math.min(MAX_HALF_LIFE_HOURS, Math.max(MIN_HALF_LIFE_HOURS, next));
}

// Rwanda is UTC+2 all year, so a learner's day starts at 22:00 UTC.
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000;

export function kigaliDay(when: Date): string {
  return new Date(when.getTime() + KIGALI_OFFSET_MS).toISOString().slice(0, 10);
}

function dayBefore(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// Days in a row with practice, ending today, or yesterday if today has none yet
// (the streak lasts until the end of today).
export function streakLength(days: readonly string[], today: string): number {
  const practised = new Set(days);
  let day = practised.has(today) ? today : dayBefore(today);
  let length = 0;
  while (practised.has(day)) {
    length += 1;
    day = dayBefore(day);
  }
  return length;
}
