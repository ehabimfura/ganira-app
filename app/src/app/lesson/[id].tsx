import { useLocalSearchParams } from 'expo-router';
import { Check, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Confetti } from '@/components/lesson/confetti';
import { LessonHeader } from '@/components/lesson/lesson-header';
import { LessonRunner } from '@/components/lesson/lesson-runner';
import { LEVEL_ICONS, LEVEL_LABELS } from '@/components/lesson/level-kinds';
import { Ride } from '@/components/ride';
import { Body, Button, ErrorText, Screen, Title } from '@/components/ui';
import { findLevel, LEVELS } from '@/content/unit1';
import { apiRequest, messageFor } from '@/lib/api';
import { returnHome } from '@/lib/navigation';
import { useCelebration } from '@/lib/sounds';
import { useSession } from '@/lib/session';
import { colors, font, fonts, palette, space } from '@/theme';

type Stage = 'goal' | 'learning' | 'saving' | 'done' | 'failed';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = findLevel(id);
  const { token, refresh } = useSession();
  const celebrate = useCelebration();
  const [stage, setStage] = useState<Stage>('goal');
  const [error, setError] = useState<string | null>(null);

  if (!level) {
    return (
      <Screen>
        <Title>Lesson not found</Title>
        <Button label="Back to lessons" onPress={returnHome} />
      </Screen>
    );
  }
  const number = LEVELS.indexOf(level) + 1;
  const KindIcon = LEVEL_ICONS[level.kind];

  // Save first, then the celebration, so it only plays once progress is safe.
  async function finish() {
    setStage('saving');
    setError(null);
    try {
      await apiRequest(`/lessons/${level!.id}/complete`, { method: 'POST', token });
      await refresh();
      celebrate();
      setStage('done');
    } catch (e) {
      setError(messageFor(e));
      setStage('failed');
    }
  }

  // Each level opens with what the learner will be able to do by the end.
  if (stage === 'goal') {
    return (
      <Screen>
        <View style={styles.center}>
          <View style={[styles.badge, { backgroundColor: palette.green }]}>
            <KindIcon size={44} color={colors.primaryText} strokeWidth={2.5} />
          </View>
          <Text style={styles.label}>
            {LEVEL_LABELS[level.kind]} · Level {number} of {LEVELS.length}
          </Text>
          <Title>{level.title}</Title>
          <Text style={styles.label}>By the end you can:</Text>
          <Text style={styles.goal}>{level.goal}</Text>
        </View>
        <Button label="Start" onPress={() => setStage('learning')} />
      </Screen>
    );
  }

  if (stage === 'saving') {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (stage === 'failed') {
    return (
      <Screen>
        <Title>{level.title}</Title>
        <ErrorText message={error} />
        <Button label="Try again" onPress={finish} />
      </Screen>
    );
  }

  if (stage === 'done') {
    const FinishIcon = level.kind === 'roleplay' ? Trophy : Check;
    return (
      <Screen>
        <Confetti />
        <View style={styles.center}>
          <View style={[styles.badge, styles.badgeLarge, { backgroundColor: palette.yellow }]}>
            <FinishIcon size={64} color={colors.primaryText} strokeWidth={3} />
          </View>
          <Text style={styles.complete}>{LEVEL_LABELS[level.kind]} complete</Text>
          <Title>{level.title}</Title>
          <Text style={styles.label}>Now you can:</Text>
          <Text style={styles.goal}>{level.goal}</Text>
        </View>
        <Button label="Continue" variant="success" onPress={returnHome} />
      </Screen>
    );
  }

  return (
    <Screen>
      {level.kind === 'roleplay' ? (
        <View style={styles.flex}>
          <LessonHeader progress={0} onQuit={returnHome} />
          <Body>{level.intro}</Body>
          <Ride turns={level.turns} onFinish={finish} />
        </View>
      ) : (
        <LessonRunner exercises={level.exercises} onFinish={finish} onQuit={returnHome} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  badgeLarge: { width: 120, height: 120, borderRadius: 60 },
  label: { fontSize: font.label, color: colors.muted, fontFamily: fonts.semibold, textAlign: 'center' },
  complete: { fontSize: font.body, color: palette.orange, fontFamily: fonts.heading, textTransform: 'uppercase', letterSpacing: 1 },
  goal: { fontSize: font.body + 2, color: colors.text, textAlign: 'center', fontFamily: fonts.semibold },
});
