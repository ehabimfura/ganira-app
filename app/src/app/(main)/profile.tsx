import { router } from 'expo-router';
import { BookOpenCheck, Info, LogOut, Target, UsersRound } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui';
import { LEVELS } from '@/content/unit1';
import { useSession } from '@/lib/session';
import { colors, font, fonts, icon, palette, radiusLarge, shadow, space } from '@/theme';

// Who is learning, their progress, and the ways out: switching profile (a parent's
// password, so a child can't wander off) or signing out (adults only).
export default function Profile() {
  const { me, signOut } = useSession();
  const profile = me?.profiles.find((p) => p.id === me.activeProfileId);
  if (!me || !profile) return null;
  const isChild = me.account.kind === 'PARENT';
  const finished = profile.completedLessons.filter((id) => LEVELS.some((l) => l.id === id)).length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar id={profile.avatar} size={112} />
          <Text style={styles.name}>{profile.nickname}</Text>
          {!isChild && <Text style={styles.username}>@{me.account.username}</Text>}
        </View>

        <View style={styles.stats}>
          <Stat icon={<BookOpenCheck size={icon.size} color={palette.green} strokeWidth={icon.stroke} />} value={`${finished} / ${LEVELS.length}`} label="Levels done" />
          <Stat icon={<Target size={icon.size} color={palette.orange} strokeWidth={icon.stroke} />} value={`${profile.dailyGoalMinutes} min`} label="Daily goal" />
        </View>

        <View style={styles.actions}>
          {isChild ? (
            <Button label="Switch profile" icon={UsersRound} variant="secondary" onPress={() => router.push('/parent-unlock')} />
          ) : (
            <Button label="Sign out" icon={LogOut} variant="secondary" onPress={signOut} />
          )}
          <Button label="Credits" icon={Info} variant="secondary" onPress={() => router.push('/credits')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon: iconNode, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      {iconNode}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  head: { alignItems: 'center', gap: space.xs, paddingTop: space.md },
  name: { fontSize: font.title, fontFamily: fonts.heading, color: colors.text },
  username: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
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
  actions: { gap: space.sm },
});
