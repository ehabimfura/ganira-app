// Level ids in the order they open on the path. The app has the same ids in
// app/src/content/unit1.ts; keep the two lists in step.
// Unit 1, "Taking a moto in Kigali": two greeting lessons, practice, calling a moto,
// where to, how much, practice, then the full ride.
export const LESSON_IDS = [
  "u1-hello",
  "u1-thanks",
  "u1-practice-1",
  "u1-moto",
  "u1-where",
  "u1-price",
  "u1-practice-2",
  "u1-ride",
] as const;

// The lesson that must be finished first, or null for the first lesson.
// Undefined means the id is not a lesson.
export function previousLesson(id: string): string | null | undefined {
  const index = (LESSON_IDS as readonly string[]).indexOf(id);
  if (index === -1) return undefined;
  return index === 0 ? null : LESSON_IDS[index - 1];
}
