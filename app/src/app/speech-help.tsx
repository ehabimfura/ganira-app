import { router } from 'expo-router';
import { Body, Button, Screen, Title } from '@/components/ui';

// Tips for when the speech check does not hear the learner (FR 12.1).
const TIPS = [
  'Find a quiet room, away from the television and the road.',
  'Hold the phone about 20 cm from your mouth.',
  'Say the whole phrase at a normal pace, then stop. The check listens for a short pause and stops by itself.',
  'Words that stay red were not heard. Tap the speaker to hear the phrase again, then try once more.',
  'In most lessons, "Can\'t speak now" lets you carry on. The first lesson always asks you to try.',
];

export default function SpeechHelp() {
  return (
    <Screen>
      <Title>When the speech check can’t hear you</Title>
      {TIPS.map((tip) => (
        <Body key={tip}>{`•  ${tip}`}</Body>
      ))}
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
