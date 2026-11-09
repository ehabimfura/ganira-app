import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorText, Screen, Title } from '@/components/ui';
import { apiRequest, messageFor } from '@/lib/api';
import { avatarEmoji } from '@/lib/avatars';
import { useSession, type Profile } from '@/lib/session';
import { colors, font, radius, space } from '@/theme';

// One Home, three situations:
//   parent with no child open -> profile picker (or "Add your child" if there are none)
//   adult learner, or a child's profile open -> their lesson path
export default function Home() {
  const { me } = useSession();
  if (!me) return null;

  const isParent = me.account.kind === 'PARENT';
  if (isParent && me.activeProfileId === null) {
    if (me.profiles.length === 0) return <Redirect href="/add-child" />;
    return <ProfilePicker />;
  }
  const active = me.profiles.find((p) => p.id === me.activeProfileId);
  if (!active) return null;
  return <LessonHome profile={active} isChild={isParent} />;
}

function ProfilePicker() {
  const { me, token, refresh, signOut } = useSession();
  const [error, setError] = useState<string | null>(null);
  if (!me) return null;

  async function open(profile: Profile) {
    if (profile.hasPin) {
      router.push({ pathname: '/pin', params: { id: String(profile.id) } });
      return;
    }
    try {
      await apiRequest(`/profiles/${profile.id}/select`, { method: 'POST', token, body: {} });
      await refresh();
    } catch (e) {
      setError(messageFor(e));
    }
  }

  return (
    <Screen>
      <Title>Who is learning?</Title>
      <View style={styles.grid}>
        {me.profiles.map((profile) => (
          <Pressable
            key={profile.id}
            accessibilityRole="button"
            accessibilityLabel={profile.nickname}
            onPress={() => open(profile)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <Text style={styles.tileAvatar}>{avatarEmoji(profile.avatar)}</Text>
            <Text style={styles.tileName}>{profile.nickname}</Text>
            {profile.hasPin ? <Text style={styles.lock}>🔒</Text> : null}
          </Pressable>
        ))}
      </View>
      <ErrorText message={error} />
      <View style={styles.flex} />
      {me.profiles.length < 6 && (
        <Button label="+ Add child" variant="secondary" onPress={() => router.push('/add-child')} />
      )}
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

// The lesson path. Lesson 1 is ready; lessons 2-5 get their content (and titles) on Nov 11.
const LESSONS = [
  { number: 1, title: 'Muraho', ready: true },
  { number: 2, title: 'Coming soon', ready: false },
  { number: 3, title: 'Coming soon', ready: false },
  { number: 4, title: 'Coming soon', ready: false },
  { number: 5, title: 'Coming soon', ready: false },
];

function LessonHome({ profile, isChild }: { profile: Profile; isChild: boolean }) {
  const { signOut } = useSession();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.avatar}>{avatarEmoji(profile.avatar)}</Text>
        <View style={styles.flex}>
          <Title>Muraho, {profile.nickname}!</Title>
          <Body>Daily goal: {profile.dailyGoalMinutes} minutes</Body>
        </View>
        {isChild && (
          <Pressable accessibilityRole="button" accessibilityLabel="Parent" onPress={() => router.push('/parent-unlock')}>
            <Text style={styles.parent}>Parent</Text>
          </Pressable>
        )}
      </View>

      {LESSONS.map((lesson) => (
        <Pressable
          key={lesson.number}
          accessibilityRole="button"
          accessibilityLabel={`Lesson ${lesson.number}: ${lesson.title}`}
          accessibilityState={{ disabled: !lesson.ready }}
          disabled={!lesson.ready}
          onPress={() => router.push('/first-lesson')}
          style={({ pressed }) => [styles.lesson, !lesson.ready && styles.locked, pressed && styles.pressed]}
        >
          <Text style={styles.lessonNumber}>{lesson.number}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonState}>{lesson.ready ? 'Start' : '🔒'}</Text>
        </Pressable>
      ))}

      <View style={styles.flex} />
      {!isChild && (
        <>
          <Button label="Credits" variant="secondary" onPress={() => router.push('/credits')} />
          <Button label="Sign out" variant="secondary" onPress={signOut} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: 140,
    padding: space.md,
    borderRadius: radius,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: space.xs,
  },
  tileAvatar: { fontSize: 48 },
  tileName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  lock: { fontSize: font.label },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  avatar: { fontSize: 40, backgroundColor: colors.surface, borderRadius: radius, padding: space.sm },
  parent: { color: colors.primary, fontWeight: '600', fontSize: font.label, padding: space.sm },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  locked: { borderColor: colors.border, opacity: 0.6 },
  lessonNumber: { fontSize: font.title, fontWeight: '800', color: colors.primary, width: 32 },
  lessonTitle: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.text },
  lessonState: { fontSize: font.label, color: colors.muted },
});
