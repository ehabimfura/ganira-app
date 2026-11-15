import { router, useFocusEffect } from 'expo-router';
import { Check, Dumbbell, Flame, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { LEVEL_ICONS, LEVEL_LABELS } from '@/components/lesson/level-kinds';
import { isUnlocked, LEVELS, UNIT_GOAL, UNIT_NUMBER, UNIT_TITLE, type Level } from '@/content/unit1';
import { haptics } from '@/lib/haptics';
import { fetchReview } from '@/lib/practice';
import { useSession } from '@/lib/session';
import { colors, font, fonts, palette, radiusLarge, space } from '@/theme';

// The path's sideways swing, in steps of 44 px: centre, right, further right, right,
// centre, left, further left, left, then again (as in the Duolingo clone's lesson buttons).
const SWING = [0, 1, 2, 1, 0, -1, -2, -1];
const STEP = 44;

export default function Learn() {
  const { me, token } = useSession();
  const [due, setDue] = useState(0);

  // Each time the path shows, ask how many phrases are ready for review.
  useFocusEffect(
    useCallback(() => {
      fetchReview(token)
        .then((phrases) => setDue(phrases.length))
        .catch(() => setDue(0));
    }, [token]),
  );

  const profile = me?.profiles.find((p) => p.id === me.activeProfileId);
  if (!profile) return null;

  const done = profile.completedLessons;
  const current = LEVELS.findIndex((level, i) => isUnlocked(i, done) && !done.includes(level.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.navigate('/profile')}>
          <Avatar id={profile.avatar} size={40} />
        </Pressable>
        <Text style={styles.hello}>Muraho, {profile.nickname}!</Text>
        <StreakBadge days={profile.streak?.days ?? 0} today={profile.streak?.practisedToday ?? false} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerUnit}>Unit {UNIT_NUMBER}</Text>
          <Text style={styles.bannerTitle}>{UNIT_TITLE}</Text>
          <Text style={styles.bannerGoal}>{UNIT_GOAL}</Text>
        </View>
        {due > 0 && <ReviewCard count={due} />}
        {LEVELS.map((level, index) => (
          <LevelButton
            key={level.id}
            level={level}
            index={index}
            state={done.includes(level.id) ? 'done' : index === current ? 'current' : isUnlocked(index, done) ? 'open' : 'locked'}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// The flame lights up once the learner has practised today, as Duolingo's does.
function StreakBadge({ days, today }: { days: number; today: boolean }) {
  const color = today ? palette.orange : colors.borderStrong;
  return (
    <View
      style={styles.streak}
      accessible
      accessibilityLabel={`Streak: ${days} ${days === 1 ? 'day' : 'days'}${today ? ', practised today' : ''}`}
    >
      <Flame size={24} color={color} fill={today ? palette.yellow : 'transparent'} strokeWidth={2.25} />
      <Text style={[styles.streakText, { color }]}>{days}</Text>
    </View>
  );
}

// Shown when phrases are about to be forgotten: a short review brings them back.
function ReviewCard({ count }: { count: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Daily review: ${count} ${count === 1 ? 'phrase' : 'phrases'}`}
      onPress={() => {
        haptics.tap();
        router.push('/review');
      }}
      style={({ pressed }) => [styles.review, pressed && styles.reviewPressed]}
    >
      <View style={styles.reviewIcon}>
        <Dumbbell size={26} color={colors.primaryText} strokeWidth={2.5} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.reviewTitle}>Daily review</Text>
        <Text style={styles.reviewBody}>
          {count} {count === 1 ? 'phrase is' : 'phrases are'} ready to refresh
        </Text>
      </View>
    </Pressable>
  );
}

type LevelState = 'done' | 'current' | 'open' | 'locked';

function LevelButton({ level, index, state }: { level: Level; index: number; state: LevelState }) {
  const locked = state === 'locked';
  const Icon = state === 'done' ? Check : LEVEL_ICONS[level.kind];
  const face = locked ? colors.border : state === 'done' ? palette.yellow : palette.green;
  const lip = locked ? colors.borderStrong : state === 'done' ? '#B08C00' : '#3A7300';

  return (
    <View style={[styles.levelRow, { transform: [{ translateX: SWING[index % SWING.length] * STEP }] }]}>
      {state === 'current' && <StartBubble />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${LEVEL_LABELS[level.kind]} ${index + 1}: ${level.title}${state === 'done' ? ', done' : ''}`}
        accessibilityState={{ disabled: locked }}
        disabled={locked}
        onPress={() => {
          haptics.tap();
          router.push({ pathname: '/lesson/[id]', params: { id: level.id } });
        }}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: face, borderBottomColor: lip },
          state === 'current' && styles.currentRing,
          pressed && styles.circlePressed,
        ]}
      >
        <Icon size={34} color={locked ? colors.borderStrong : colors.primaryText} strokeWidth={3} />
        {locked && (
          <View style={styles.lock}>
            <Lock size={12} color={colors.primaryText} strokeWidth={3} />
          </View>
        )}
      </Pressable>
      <Text style={[styles.levelTitle, locked && styles.levelTitleLocked]}>{level.title}</Text>
    </View>
  );
}

// The bobbing "START" label over the next level to do.
function StartBubble() {
  const [bob] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View
      style={[styles.bubble, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}
    >
      <Text style={styles.bubbleText}>Start</Text>
      <View style={styles.bubbleTail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 2,
    borderColor: colors.border,
  },
  hello: { flex: 1, fontSize: font.body + 2, fontFamily: fonts.heading, color: colors.text },
  flex: { flex: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: font.body + 2, fontFamily: fonts.heading },
  review: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radiusLarge,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reviewPressed: { borderBottomWidth: 2, marginTop: 3 },
  reviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.orange,
  },
  reviewTitle: { fontSize: font.body + 2, fontFamily: fonts.heading, color: colors.text },
  reviewBody: { fontSize: font.label + 1, fontFamily: fonts.regular, color: colors.muted },
  content: { padding: space.lg, paddingBottom: space.xl * 2, alignItems: 'center', gap: space.lg },
  banner: {
    alignSelf: 'stretch',
    gap: 4,
    padding: space.md,
    borderRadius: radiusLarge,
    backgroundColor: palette.green,
    borderBottomWidth: 5,
    borderBottomColor: '#3A7300',
    marginBottom: space.md,
  },
  bannerUnit: { fontSize: font.label, fontFamily: fonts.bold, color: '#FFFFFFCC', textTransform: 'uppercase', letterSpacing: 1 },
  bannerTitle: { fontSize: font.title - 4, fontFamily: fonts.heading, color: colors.primaryText },
  bannerGoal: { fontSize: font.label + 1, fontFamily: fonts.regular, color: colors.primaryText },
  levelRow: { alignItems: 'center', gap: space.xs },
  circle: {
    width: 76,
    height: 70,
    borderRadius: 38,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePressed: { borderBottomWidth: 0, marginTop: 7, height: 63 },
  currentRing: { shadowColor: palette.green, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: { fontSize: font.label, fontFamily: fonts.bold, color: colors.text },
  levelTitleLocked: { color: colors.muted, opacity: 0.6 },
  bubble: {
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 2,
  },
  bubbleText: { fontSize: font.label, fontFamily: fonts.heading, color: palette.green, textTransform: 'uppercase', letterSpacing: 1 },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
});
