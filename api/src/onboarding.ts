import { z } from "zod";

// Answer values for the onboarding questions (SRS FR 2.1, FR 2.2).
// Path and role match the enumerations in the class diagram.
export const PATHS = ["FAMILY", "LIVING_IN_RWANDA"] as const;
export const ROLES = ["TOURIST", "STUDENT", "TEACHER", "WORKER"] as const;
export const LEVELS = ["NEW", "FEW_WORDS", "SHORT_CHAT"] as const;
export const DAILY_GOALS = [5, 10, 15] as const;

export const dailyGoal = z.union(DAILY_GOALS.map((m) => z.literal(m)));
export const level = z.enum(LEVELS);

export const learnerOnboarding = {
  nativeLanguage: z.string().trim().min(1).max(40),
  path: z.enum(PATHS),
  learnerRole: z.enum(ROLES),
  level,
  dailyGoalMinutes: dailyGoal,
};
