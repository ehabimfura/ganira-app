import type { DailyGoal, Level } from './onboarding-draft';

// Answer options shared by the learner's onboarding and the parent's "Add your child".
export const LEVEL_OPTIONS: { value: Level; label: string }[] = [
  { value: 'NEW', label: 'New to Kinyarwanda' },
  { value: 'FEW_WORDS', label: 'I know a few words' },
  { value: 'SHORT_CHAT', label: 'I can hold a short chat' },
];

// SRS FR 2.2: 5, 10 or 15 minutes a day.
export const GOAL_OPTIONS: { minutes: DailyGoal; hint: string }[] = [
  { minutes: 5, hint: 'Casual' },
  { minutes: 10, hint: 'Regular' },
  { minutes: 15, hint: 'Serious' },
];

// A range instead of a birth date, so Ganira stores less about each child.
export const AGE_RANGES = ['4-6', '7-9', '10-12', '13-17'] as const;
