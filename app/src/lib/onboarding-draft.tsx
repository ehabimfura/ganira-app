import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// A learner's answers before they have an account. Kept in memory only:
// nothing is stored on the phone or sent anywhere until "Save your progress".
export type Level = 'NEW' | 'FEW_WORDS' | 'SHORT_CHAT';
export type DailyGoal = 5 | 10 | 15;

export interface Draft {
  birthYear?: number;
  level?: Level;
  dailyGoalMinutes?: DailyGoal;
}

interface DraftValue {
  draft: Draft;
  update(changes: Draft): void;
  clear(): void;
}

const DraftContext = createContext<DraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({});
  const value = useMemo<DraftValue>(
    () => ({
      draft,
      update: (changes) => setDraft((current) => ({ ...current, ...changes })),
      clear: () => setDraft({}),
    }),
    [draft],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft(): DraftValue {
  const value = useContext(DraftContext);
  if (!value) throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  return value;
}
