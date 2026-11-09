import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Choice, Screen, Title } from '@/components/ui';
import { useOnboardingDraft, type Level } from '@/lib/onboarding-draft';

const LEVEL_OPTIONS: { value: Level; label: string }[] = [
  { value: 'NEW', label: 'New to Kinyarwanda' },
  { value: 'FEW_WORDS', label: 'I know a few words' },
  { value: 'SHORT_CHAT', label: 'I can hold a short chat' },
];

export default function LevelScreen() {
  const { draft, update } = useOnboardingDraft();
  const [level, setLevel] = useState<Level | undefined>(draft.level);

  return (
    <Screen>
      <Title>How much Kinyarwanda do you know?</Title>
      {LEVEL_OPTIONS.map((option) => (
        <Choice
          key={option.value}
          label={option.label}
          selected={level === option.value}
          onPress={() => setLevel(option.value)}
        />
      ))}
      <Button
        label="Continue"
        disabled={!level}
        onPress={() => {
          update({ level });
          router.push('/daily-goal');
        }}
      />
    </Screen>
  );
}
