import { Redirect, router } from 'expo-router';
import { Lock, LogOut, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button, ErrorText, Screen, Title } from '@/components/ui';
import { apiRequest, messageFor } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useSession, type Profile } from '@/lib/session';
import { colors, font, fonts, radiusLarge, shadow, space } from '@/theme';

// Home only decides where a signed-in account belongs:
//   parent with no child open -> profile picker (or "Add your child" if there are none)
//   adult learner, or a child's profile open -> the Learn tab
export default function Home() {
  const { me } = useSession();
  if (!me) return null;

  const isParent = me.account.kind === 'PARENT';
  if (isParent && me.activeProfileId === null) {
    if (me.profiles.length === 0) return <Redirect href="/add-child" />;
    return <ProfilePicker />;
  }
  return <Redirect href="/learn" />;
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
            accessibilityLabel={profile.hasPin ? `${profile.nickname}, has a PIN` : profile.nickname}
            onPress={() => {
              haptics.tap();
              open(profile);
            }}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <Avatar id={profile.avatar} size={72} />
            <Text style={styles.tileName}>{profile.nickname}</Text>
            {profile.hasPin ? <Lock size={14} color={colors.muted} strokeWidth={2.5} /> : null}
          </Pressable>
        ))}
      </View>
      <ErrorText message={error} />
      <View style={styles.flex} />
      {me.profiles.length < 6 && (
        <Button label="Add child" icon={UserPlus} variant="secondary" onPress={() => router.push('/add-child')} />
      )}
      {me.profiles.some((p) => p.kind === 'CHILD') && (
        <Button label="Parent view" variant="secondary" onPress={() => router.push('/parent-view')} />
      )}
      <Button label="Sign out" icon={LogOut} variant="secondary" onPress={signOut} />
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
    borderRadius: radiusLarge,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    ...shadow,
    alignItems: 'center',
    gap: space.xs,
  },
  tileName: { fontSize: font.body, fontFamily: fonts.headingBold, color: colors.text },
});
