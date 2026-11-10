import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Speak } from '@/components/speak';
import { Body, Button } from '@/components/ui';
import type { Step } from '@/content/module1';
import { useClipPlayer } from '@/lib/sounds';
import { colors, font, radius, space } from '@/theme';

// Lessons 1-4: one phrase at a time. A "say" phrase is heard, then spoken (the speech
// check turns the heard words green); Next appears after the first try.
export function StepLesson({ steps, onFinish }: { steps: Step[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;
  const next = () => (isLast ? onFinish() : setIndex(index + 1));

  return (
    <View style={styles.flex}>
      <Text style={styles.progress}>
        {index + 1} / {steps.length}
      </Text>
      {/* The key gives every step a fresh card, so "heard" starts false each time. */}
      <StepCard key={index} step={steps[index]} nextLabel={isLast ? 'Finish' : 'Next'} onNext={next} />
    </View>
  );
}

function StepCard({ step, nextLabel, onNext }: { step: Step; nextLabel: string; onNext: () => void }) {
  const play = useClipPlayer();
  const { line } = step;
  const [heard, setHeard] = useState(!line.audio);
  const [spoke, setSpoke] = useState(step.kind === 'hear');

  const listen = () => {
    if (!line.audio) return;
    play(line.audio);
    setHeard(true);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        {step.kind === 'hear' && <Text style={styles.who}>🏍️ The motari says</Text>}
        <Text style={styles.phrase}>{line.text}</Text>
        <Text style={styles.meaning}>{line.meaning}</Text>
      </View>
      <View style={styles.actions}>
        {line.audio ? <Button label="🔊 Listen" variant="secondary" onPress={listen} /> : null}
        {heard && step.kind === 'say' && (
          <>
            <Body>Now say it out loud!</Body>
            <Speak expected={line.text} onTried={() => setSpoke(true)} />
          </>
        )}
        {heard && spoke && <Button label={nextLabel} onPress={onNext} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  progress: { fontSize: font.label, color: colors.muted, textAlign: 'center' },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
  who: { fontSize: font.label, color: colors.muted, fontWeight: '600' },
  phrase: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  meaning: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  actions: { gap: space.md },
});
