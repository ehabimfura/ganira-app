import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StepLesson } from '@/components/lesson-steps';
import { Ride } from '@/components/ride';
import { Body, Button, ErrorText, Screen, Title } from '@/components/ui';
import { findLesson, LESSONS } from '@/content/module1';
import { apiRequest, messageFor } from '@/lib/api';
import { returnHome } from '@/lib/navigation';
import { useSuccessFeedback } from '@/lib/sounds';
import { useSession } from '@/lib/session';
import { colors, font } from '@/theme';

type Stage = 'learning' | 'saving' | 'done' | 'failed';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = findLesson(id);
  const { token, refresh } = useSession();
  const success = useSuccessFeedback();
  const [stage, setStage] = useState<Stage>('learning');
  const [error, setError] = useState<string | null>(null);

  if (!lesson) {
    return (
      <Screen>
        <Title>Lesson not found</Title>
        <Button label="Back to lessons" onPress={returnHome} />
      </Screen>
    );
  }
  const number = LESSONS.indexOf(lesson) + 1;

  // Save first, then the sound and vibration, so they only play once progress is safe.
  async function finish() {
    setStage('saving');
    setError(null);
    try {
      await apiRequest(`/lessons/${lesson!.id}/complete`, { method: 'POST', token });
      await refresh();
      success();
      setStage('done');
    } catch (e) {
      setError(messageFor(e));
      setStage('failed');
    }
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
        <Title>{lesson.title}</Title>
        <ErrorText message={error} />
        <Button label="Try again" onPress={finish} />
      </Screen>
    );
  }

  if (stage === 'done') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.mark}>{lesson.kind === 'ride' ? '🏍️' : '✓'}</Text>
          <Title>{lesson.title}</Title>
          <Body>Lesson {number} complete</Body>
        </View>
        <Button label="Back to lessons" onPress={returnHome} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>
        {number}. {lesson.title}
      </Title>
      {lesson.kind === 'ride' ? (
        <Ride intro={lesson.intro} turns={lesson.turns} onFinish={finish} />
      ) : (
        <StepLesson steps={lesson.steps} onFinish={finish} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mark: { fontSize: font.hero * 2, color: colors.primary, fontWeight: '800' },
});
