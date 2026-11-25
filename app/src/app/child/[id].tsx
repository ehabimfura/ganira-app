import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button, Choice, ErrorText, Field, Screen, Title } from '@/components/ui';
import { messageFor } from '@/lib/api';
import { fetchChildProgress, updateChildSettings, type ChildProgress } from '@/lib/progress-data';
import { useSession } from '@/lib/session';
import { colors, font, fonts, radiusLarge, shadow, space } from '@/theme';

const GOALS = [5, 10, 15];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// A child's progress, and the parent's controls for the daily goal and reminder (FR 10.1, FR 10.2).
export default function ChildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileId = Number(id);
  const { token } = useSession();
  const [child, setChild] = useState<ChildProgress | null>(null);
  const [goal, setGoal] = useState(5);
  const [reminder, setReminder] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetchChildProgress(token, profileId)
      .then((c) => {
        if (!live) return;
        setChild(c);
        setGoal(c.dailyGoalMinutes);
        setReminder(c.reminderTime ?? '');
      })
      .catch((e) => live && setError(messageFor(e)));
    return () => {
      live = false;
    };
  }, [token, profileId]);

  async function save() {
    if (!token) return;
    const time = reminder.trim();
    if (time !== '' && !TIME.test(time)) {
      setError('Use the time as HH:MM, for example 17:30.');
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateChildSettings(token, profileId, { dailyGoalMinutes: goal, reminderTime: time === '' ? null : time });
      setSaved(true);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }

  if (!child) {
    return (
      <Screen>
        {error ? <ErrorText message={error} /> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar id={child.avatar} size={96} />
          <Title>{child.nickname}</Title>
        </View>

        <View style={styles.stats}>
          <Stat value={`${child.streakDays}`} label={child.streakDays === 1 ? 'Day in a row' : 'Days in a row'} />
          <Stat value={`${child.minutesPractised}`} label="Minutes practised" />
          <Stat value={`${child.lessonsDone} / ${child.lessonsTotal}`} label="Lessons done" />
          <Stat value={`${child.phrasesLearned}`} label="Phrases learned" />
        </View>

        <Text style={styles.heading}>Daily goal</Text>
        {GOALS.map((minutes) => (
          <Choice key={minutes} label={`${minutes} minutes a day`} status={goal === minutes ? 'selected' : 'none'} onPress={() => setGoal(minutes)} />
        ))}

        <Field
          label="Reminder time (HH:MM, Kigali time)"
          value={reminder}
          onChangeText={(text) => {
            setReminder(text);
            setSaved(false);
          }}
          placeholder="17:30"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <Text style={styles.hint}>Leave empty for no reminder.</Text>

        <ErrorText message={error} />
        {saved ? <Text style={styles.saved}>Saved.</Text> : null}
        <Button label="Save" variant="success" busy={busy} onPress={save} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: ReactNode }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.lg },
  head: { alignItems: 'center', gap: space.xs },
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
  heading: { fontSize: font.body, fontFamily: fonts.heading, color: colors.text },
  hint: { fontSize: font.label, fontFamily: fonts.regular, color: colors.muted },
  saved: { fontSize: font.label, fontFamily: fonts.semibold, color: colors.successText },
});
