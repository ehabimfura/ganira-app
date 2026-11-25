import { Dumbbell, Flame } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Confetti } from '@/components/lesson/confetti';
import { LessonRunner } from '@/components/lesson/lesson-runner';
import { Body, Button, ErrorText, Screen, Title } from '@/components/ui';
import { reviewExercises, type Exercise } from '@/content/unit1';
import { messageFor } from '@/lib/api';
import { returnHome } from '@/lib/navigation';
import { fetchReview, saveReview, type PracticeResult } from '@/lib/practice';
import { useCelebration } from '@/lib/sounds';
import { useSession } from '@/lib/session';
import { colors, font, fonts, palette, space } from '@/theme';

type Stage = 'loading' | 'empty' | 'reviewing' | 'saving' | 'done' | 'failed';

// The daily review: the phrases this learner is most likely to have forgotten come back
// just in time (spaced repetition, api/src/practice/memory.ts).
export default function Review() {
  const { token, refresh } = useSession();
  const celebrate = useCelebration();
  const [stage, setStage] = useState<Stage>('loading');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<PracticeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReview(token)
      .then((due) => {
        const built = reviewExercises(due.map((d) => d.phrase));
        setExercises(built);
        setStage(built.length ? 'reviewing' : 'empty');
      })
      .catch((e) => {
        setError(messageFor(e));
        setStage('failed');
      });
  }, [token]);

  async function finish(results: PracticeResult[] = answers) {
    setAnswers(results);
    setStage('saving');
    setError(null);
    try {
      await saveReview(token, results);
      await refresh();
      celebrate();
      setStage('done');
    } catch (e) {
      setError(messageFor(e));
      setStage('failed');
    }
  }

  if (stage === 'loading' || stage === 'saving') {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (stage === 'empty') {
    return (
      <Screen>
        <View style={styles.center}>
          <Dumbbell size={56} color={palette.green} strokeWidth={2.25} />
          <Title>Nothing to review yet</Title>
          <Body>Phrases come back here when you are about to forget them.</Body>
        </View>
        <Button label="Back to lessons" onPress={returnHome} />
      </Screen>
    );
  }

  if (stage === 'failed') {
    return (
      <Screen>
        <Title>Daily review</Title>
        <ErrorText message={error} />
        {answers.length ? <Button label="Try again" onPress={() => finish()} /> : null}
        <Button label="Back to lessons" variant="secondary" onPress={returnHome} />
      </Screen>
    );
  }

  if (stage === 'done') {
    return (
      <Screen>
        <Confetti />
        <View style={styles.center}>
          <View style={styles.badge}>
            <Flame size={64} color={colors.primaryText} strokeWidth={2.5} />
          </View>
          <Text style={styles.complete}>Review complete</Text>
          <Title>{answers.length} phrases refreshed</Title>
        </View>
        <Button label="Continue" variant="success" onPress={returnHome} />
      </Screen>
    );
  }

  return (
    <Screen>
      <LessonRunner exercises={exercises} onFinish={finish} onQuit={returnHome} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.yellow,
    marginBottom: space.sm,
  },
  complete: { fontSize: font.body, color: palette.yellow, fontFamily: fonts.heading, textTransform: 'uppercase', letterSpacing: 1 },
});
