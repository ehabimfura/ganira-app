import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Choice, Screen, Title } from '@/components/ui';
import { useOnboardingDraft, type DailyGoal } from '@/lib/onboarding-draft';
import { GOAL_OPTIONS } from '@/lib/onboarding-options';

export default function DailyGoalScreen() {
  const { draft, update } = useOnboardingDraft();
  const [goal, setGoal] = useState<DailyGoal | undefined>(draft.dailyGoalMinutes);

  return (
    <Screen>
      <Title>How much time a day?</Title>
      <Body>You can change this later.</Body>
      {GOAL_OPTIONS.map((option) => (
        <Choice
          key={option.minutes}
          label={`${option.minutes} minutes a day`}
          hint={option.hint}
          selected={goal === option.minutes}
          onPress={() => setGoal(option.minutes)}
        />
      ))}
      <Button
        label="Continue"
        disabled={!goal}
        onPress={() => {
          update({ dailyGoalMinutes: goal });
          router.push('/first-lesson');
        }}
      />
    </Screen>
  );
}
