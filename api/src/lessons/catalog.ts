// Lesson ids in the order they open. The app has the same ids in
// app/src/content/module1.ts; keep the two lists in step.
// Module 1, "Taking a moto in Kigali": greetings, yes/no, where to, how much, the ride.
export const LESSON_IDS = ["moto-1", "moto-2", "moto-3", "moto-4", "moto-5"] as const;

// The lesson that must be finished first, or null for the first lesson.
// Undefined means the id is not a lesson.
export function previousLesson(id: string): string | null | undefined {
  const index = (LESSON_IDS as readonly string[]).indexOf(id);
  if (index === -1) return undefined;
  return index === 0 ? null : LESSON_IDS[index - 1];
}
