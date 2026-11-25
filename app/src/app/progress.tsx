import { router } from 'expo-router';
import { BookOpenCheck, Clock, Flame, Languages } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEVEL_LABELS } from '@/components/lesson/level-kinds';
import { Body, Choice, ErrorText, Screen, Title } from '@/components/ui';
import { findLevel } from '@/content/unit1';
import { messageFor } from '@/lib/api';
import { fetchProgress, fetchSaved, type ProgressSummary } from '@/lib/progress-data';
import { useSession } from '@/lib/session';
import { colors, font, fonts, icon, palette, radiusLarge, shadow, space } from '@/theme';

// How the profile is getting on (FR 9.1), and the lessons it saved to come back to (FR 8).
export default function ProgressScreen() {
  const { token } = useSession();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    Promise.all([fetchProgress(token), fetchSaved(token)])
      .then(([progress, saved]) => {
        if (!live) return;
        setSummary(progress);
        setSavedIds(saved.lessons);
      })
      .catch((e) => {
        if (live) setError(messageFor(e));
      });
    return () => {
      live = false;
    };
  }, [token]);

  const savedLevels = savedIds.flatMap((id) => {
    const level = findLevel(id);
    return level ? [level] : [];
  });

  return (
    <Screen>
      <Title>My progress</Title>
      <ErrorText message={error} />
      {!summary && !error ? <ActivityIndicator color={colors.primary} /> : null}

      {summary ? (
        <>
          <View style={styles.stats}>
            <Stat icon={<Flame size={icon.size} color={palette.yellow} strokeWidth={icon.stroke} />} value={`${summary.streakDays}`} label={summary.streakDays === 1 ? 'Day in a row' : 'Days in a row'} />
            <Stat icon={<Clock size={icon.size} color={palette.cyan} strokeWidth={icon.stroke} />} value={`${summary.minutesPractised}`} label="Minutes practised" />
            <Stat icon={<BookOpenCheck size={icon.size} color={palette.green} strokeWidth={icon.stroke} />} value={`${summary.lessonsDone} / ${summary.lessonsTotal}`} label="Lessons done" />
            <Stat icon={<Languages size={icon.size} color={palette.blue} strokeWidth={icon.stroke} />} value={`${summary.phrasesLearned}`} label="Phrases learned" />
          </View>

          <Text style={styles.heading}>Saved lessons</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {savedLevels.length === 0 ? (
              <Body>Nothing saved yet. Save a lesson from its first screen to come back to it.</Body>
            ) : (
              savedLevels.map((level) => (
                <Choice
                  key={level.id}
                  label={level.title}
                  hint={LEVEL_LABELS[level.kind]}
                  onPress={() => router.push(`/lesson/${level.id}`)}
                />
              ))
            )}
          </ScrollView>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ icon: iconNode, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      {iconNode}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: {
    width: '48%',
    flexGrow: 1,
    gap: 4,
    padding: space.md,
    borderRadius: radiusLarge,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow,
  },
  statValue: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
  statLabel: { fontSize: font.label, fontFamily: fonts.regular, color: colors.muted },
  heading: { fontSize: font.body, fontFamily: fonts.heading, color: colors.text, marginTop: space.sm },
  list: { gap: space.sm, paddingBottom: space.lg },
});
