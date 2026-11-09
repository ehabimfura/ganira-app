import { z } from "zod";

// Onboarding answers (SRS FR 2.1, FR 2.2). The app is in English for English speakers,
// and the path follows from the account: adult learners take ADULT ("Everyday
// Kinyarwanda", wherever they live) and children take FAMILY. So only the level
// and the daily goal are asked.
export const LEVELS = ["NEW", "FEW_WORDS", "SHORT_CHAT"] as const;
export const DAILY_GOALS = [5, 10, 15] as const;
export const ADULT_PATH = "ADULT";
export const CHILD_PATH = "FAMILY";

export const dailyGoal = z.union(DAILY_GOALS.map((m) => z.literal(m)));
export const level = z.enum(LEVELS);

export const learnerOnboarding = {
  level,
  dailyGoalMinutes: dailyGoal,
};
