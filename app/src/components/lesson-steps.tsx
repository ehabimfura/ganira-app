import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ride } from '@/components/ride';
import { Speak } from '@/components/speak';
import { Body, Button, Choice } from '@/components/ui';
import type { Line, Step } from '@/content/module1';
import { useClipPlayer, useSuccessFeedback } from '@/lib/sounds';
import { colors, font, radius, space } from '@/theme';

// Lessons 1-4, one step at a time: learn, listen, recall, talk (see content/module1.ts).
// Next appears once the step has been tried; there is no pass mark.
export function StepLesson({ steps, onFinish }: { steps: Step[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;
  const next = () => (isLast ? onFinish() : setIndex(index + 1));
  const nextLabel = isLast ? 'Finish' : 'Next';
  const step = steps[index];

  return (
    <View style={styles.flex}>
      <Text style={styles.progress}>
        {index + 1} / {steps.length}
      </Text>
      {/* The key gives every step a fresh card, so its state starts over. */}
      {step.kind === 'learn' && <LearnCard key={index} line={step.line} nextLabel={nextLabel} onNext={next} />}
      {step.kind === 'listen' && (
        <ListenCard key={index} line={step.line} wrongMeanings={step.wrongMeanings} nextLabel={nextLabel} onNext={next} />
      )}
      {step.kind === 'recall' && <RecallCard key={index} line={step.line} nextLabel={nextLabel} onNext={next} />}
      {step.kind === 'talk' && (
        <View key={index} style={styles.flex}>
          <Text style={styles.who}>🏍️ Now try it with the motari</Text>
          <Ride turns={step.turns} onFinish={next} finishLabel={nextLabel} />
        </View>
      )}
    </View>
  );
}

interface CardProps {
  line: Line;
  nextLabel: string;
  onNext: () => void;
}

// Learn: hear the phrase, then say it.
function LearnCard({ line, nextLabel, onNext }: CardProps) {
  const play = useClipPlayer();
  const [heard, setHeard] = useState(!line.audio);
  const [spoke, setSpoke] = useState(false);

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        <Text style={styles.label}>New</Text>
        <Text style={styles.phrase}>{line.text}</Text>
        <Text style={styles.meaning}>{line.meaning}</Text>
      </View>
      <View style={styles.actions}>
        {line.audio ? (
          <Button
            label="🔊 Listen"
            variant="secondary"
            onPress={() => {
              play(line.audio);
              setHeard(true);
            }}
          />
        ) : null}
        {heard && (
          <>
            <Body>Now say it out loud!</Body>
            <Speak expected={line.text} onTried={() => setSpoke(true)} />
          </>
        )}
        {spoke && <Button label={nextLabel} onPress={onNext} />}
      </View>
    </View>
  );
}

// Recall: only the English shows. Saying it from memory is what makes it stick
// (retrieval practice). A learner who is stuck can hear the answer first.
function RecallCard({ line, nextLabel, onNext }: CardProps) {
  const play = useClipPlayer();
  const [revealed, setRevealed] = useState(false);
  const [tried, setTried] = useState(false);

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        <Text style={styles.label}>How do you say</Text>
        <Text style={styles.phrase}>“{line.meaning}”</Text>
        {revealed && <Text style={styles.meaning}>{line.text}</Text>}
      </View>
      <View style={styles.actions}>
        <Speak
          expected={line.text}
          onTried={() => {
            setTried(true);
            setRevealed(true);
          }}
        />
        {line.audio && !revealed ? (
          <Button
            label="🔊 Hear the answer"
            variant="secondary"
            onPress={() => {
              play(line.audio);
              setRevealed(true);
            }}
          />
        ) : null}
        {line.audio && tried ? <Button label="🔊 Listen" variant="secondary" onPress={() => play(line.audio)} /> : null}
        {tried && <Button label={nextLabel} onPress={onNext} />}
      </View>
    </View>
  );
}

// Listen: the motari speaks; the learner picks what it means. Until the motari's
// recording exists, the words are shown instead.
function ListenCard({ line, wrongMeanings, nextLabel, onNext }: CardProps & { wrongMeanings: string[] }) {
  const play = useClipPlayer();
  const success = useSuccessFeedback();
  const [picked, setPicked] = useState<string | null>(null);

  // A fixed order (not random), with the right answer's place varying from step to step.
  const options = useMemo(() => {
    const at = line.text.length % (wrongMeanings.length + 1);
    return [...wrongMeanings.slice(0, at), line.meaning, ...wrongMeanings.slice(at)];
  }, [line, wrongMeanings]);

  useEffect(() => {
    play(line.audio);
  }, [play, line.audio]);

  const pick = (option: string) => {
    if (picked) return;
    setPicked(option);
    if (option === line.meaning) success();
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const mark = (option: string) => {
    if (!picked) return '';
    if (option === line.meaning) return '✓ ';
    return option === picked ? '✗ ' : '';
  };

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        <Text style={styles.label}>🏍️ The motari says</Text>
        {!line.audio || picked ? <Text style={styles.phrase}>{line.text}</Text> : <Text style={styles.phrase}>🔊</Text>}
        <Text style={styles.meaning}>What does it mean?</Text>
      </View>
      <View style={styles.actions}>
        {line.audio ? <Button label="🔊 Play again" variant="secondary" onPress={() => play(line.audio)} /> : null}
        {options.map((option) => (
          <Choice
            key={option}
            label={`${mark(option)}${option}`}
            // After a pick, only the right meaning is highlighted; a wrong pick keeps just its ✗.
            selected={picked !== null && option === line.meaning}
            onPress={() => pick(option)}
          />
        ))}
        {picked && <Button label={nextLabel} onPress={onNext} />}
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
  label: { fontSize: font.label, color: colors.muted, fontWeight: '600' },
  who: { fontSize: font.label, color: colors.primary, fontWeight: '700' },
  phrase: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  meaning: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  actions: { gap: space.sm },
});
