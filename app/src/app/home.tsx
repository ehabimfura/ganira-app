import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen, Title } from '@/components/ui';
import { avatarEmoji } from '@/lib/avatars';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/theme';

// Placeholder until step C adds the lesson path and the parent's area.
export default function Home() {
  const { me, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  if (!me) return null;

  const active = me.profiles.find((p) => p.id === me.activeProfileId);
  const isParent = me.account.kind === 'PARENT';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.avatar}>{active ? avatarEmoji(active.avatar) : '👤'}</Text>
        <Title>Muraho, {active?.nickname ?? me.account.username}!</Title>
      </View>
      <Body>
        {isParent
          ? `Parent account · ${me.profiles.length} child profile(s)`
          : `Learner account · daily goal ${active?.dailyGoalMinutes ?? '-'} minutes`}
      </Body>
      <View style={styles.flex} />
      <Button
        label="Sign out"
        variant="secondary"
        busy={busy}
        onPress={() => {
          setBusy(true);
          signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xl },
  avatar: { fontSize: 40, backgroundColor: colors.surface, borderRadius: radius, padding: space.sm },
  flex: { flex: 1 },
});
