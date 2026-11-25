import { useLocalSearchParams } from 'expo-router';
import { Bookmark, Check, Trophy } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Confetti } from '@/components/lesson/confetti';
import { LessonHeader } from '@/components/lesson/lesson-header';
import { LessonRunner } from '@/components/lesson/lesson-runner';
import { LEVEL_LABELS, levelIconElement } from '@/components/lesson/level-kinds';
import { Ride } from '@/components/ride';
import { Body, Button, ErrorText, Screen, Title } from '@/components/ui';
import { findLevel, LEVELS } from '@/content/unit1';
import { apiRequest, ApiError, messageFor } from '@/lib/api';
import { queueCompletion, sendPending } from '@/lib/offline-queue';
import { fetchSaved, setLessonSaved } from '@/lib/progress-data';
import { returnHome } from '@/lib/navigation';
import type { PracticeResult } from '@/lib/practice';
import { useCelebration } from '@/lib/sounds';
import { useSession } from '@/lib/session';
import { colors, font, fonts, palette, space } from '@/theme';

type Stage = 'goal' | 'learning' | 'saving' | 'done' | 'failed';

// The server accepts at most an hour for one lesson.
const MAX_LESSON_SECONDS = 3600;

// The time now, in milliseconds. Read in an effect, when the learner starts a lesson.
const clock = (): number => Date.now();

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = findLevel(id);
  const { token, refresh, completeLessonLocally } = useSession();
  const celebrate = useCelebration();
  const [stage, setStage] = useState<Stage>('goal');
  const [error, setError] = useState<string | null>(null);
  // Kept so "Try again" after a failed save still sends the lesson's answers.
  const [answers, setAnswers] = useState<PracticeResult[]>([]);
  // The ride's own progress (0 to 1), so the bar moves as the conversation goes on.
  const [rideProgress, setRideProgress] = useState(0);
  // Whether this lesson is saved to come back to (FR 8).
  const [saved, setSaved] = useState(false);
  // True when the lesson was finished without internet and waits on the phone.
  const [savedOnPhone, setSavedOnPhone] = useState(false);
  // When the learner pressed Start, so the time spent can be sent with the lesson.
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchSaved(token)
      .then((items) => setSaved(items.lessons.includes(id)))
      .catch(() => {});
  }, [token, id]);

  async function toggleSaved() {
    if (!token) return;
    const next = !saved;
    setSaved(next);
    try {
      await setLessonSaved(token, id, next);
    } catch {
      setSaved(!next);
    }
  }

  // Start the clock once the learner begins (not while the goal screen is showing).
  useEffect(() => {
    if (stage === 'learning' && startedAt.current === null) startedAt.current = clock();
  }, [stage]);

  if (!level) {
    return (
      <Screen>
        <Title>Lesson not found</Title>
        <Button label="Back to lessons" onPress={returnHome} />
      </Screen>
    );
  }
  const number = LEVELS.indexOf(level) + 1;


  // Save first, then the celebration, so it only plays once progress is safe.
  // With no internet, the lesson is kept on the phone and sent later (FR 4.7).
  async function finish(results: PracticeResult[] = answers) {
    setAnswers(results);
    setStage('saving');
    setError(null);
    setSavedOnPhone(false);
    const seconds = startedAt.current
      ? Math.min(MAX_LESSON_SECONDS, Math.round((clock() - startedAt.current) / 1000))
      : 0;
    try {
      await apiRequest(`/lessons/${level!.id}/complete`, {
        method: 'POST',
        token,
        body: { results, seconds },
      });
      if (token) sendPending(token).catch(() => {});
      await refresh();
      celebrate();
      setStage('done');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NETWORK') {
        queueCompletion({ lessonId: level!.id, results, seconds });
        completeLessonLocally(level!.id);
        setSavedOnPhone(true);
        celebrate();
        setStage('done');
        return;
      }
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
            {levelIconElement(level, { size: 44, color: colors.primaryText, strokeWidth: 2.5 })}
          </View>
          <Text style={styles.label}>
            {LEVEL_LABELS[level.kind]} · Level {number} of {LEVELS.length}
          </Text>
          <Title>{level.title}</Title>
          <Text style={styles.label}>By the end you can:</Text>
          <Text style={styles.goal}>{level.goal}</Text>
        </View>
        <View style={styles.actions}>
          <Button label="Start" onPress={() => setStage('learning')} />
          <Button
            label={saved ? 'Saved for offline' : 'Save lesson for offline'}
            icon={Bookmark}
            variant={saved ? 'success' : 'secondary'}
            onPress={toggleSaved}
          />
        </View>
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
        <Button label="Try again" onPress={() => finish()} />
      </Screen>
    );
  }

  if (stage === 'done') {
    return (
      <Screen>
        <Confetti />
        <View style={styles.center}>
          <View style={[styles.badge, styles.badgeLarge, { backgroundColor: palette.yellow }]}>
            {level.kind === 'roleplay' ? (
              <Trophy size={64} color={colors.primaryText} strokeWidth={3} />
            ) : (
              <Check size={64} color={colors.primaryText} strokeWidth={3} />
            )}
          </View>
          <Text style={styles.complete}>{LEVEL_LABELS[level.kind]} complete</Text>
          <Title>{level.title}</Title>
          <Text style={styles.label}>Now you can:</Text>
          <Text style={styles.goal}>{level.goal}</Text>
          {savedOnPhone ? (
            <Text style={styles.label}>No internet. Your progress is saved on this phone and will be sent when you are back online.</Text>
          ) : null}
        </View>
        <Button label="Continue" variant="success" onPress={returnHome} />
      </Screen>
    );
  }

  return (
    <Screen>
      {level.kind === 'roleplay' ? (
        <View style={styles.flex}>
          <LessonHeader progress={rideProgress} onQuit={returnHome} />
          <Body>{level.intro}</Body>
          <Ride turns={level.turns} onFinish={() => finish()} onProgress={setRideProgress} />
        </View>
      ) : (
        <LessonRunner exercises={level.exercises} onFinish={finish} onQuit={returnHome} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  actions: { gap: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  badgeLarge: { width: 120, height: 120, borderRadius: 60 },
  label: { fontSize: font.label, color: colors.muted, fontFamily: fonts.semibold, textAlign: 'center' },
  complete: { fontSize: font.body, color: colors.inkYellow, fontFamily: fonts.heading, textTransform: 'uppercase', letterSpacing: 1 },
  goal: { fontSize: font.body + 2, color: colors.text, textAlign: 'center', fontFamily: fonts.semibold },
});
