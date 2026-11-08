import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorText, Field, Title } from '@/components/ui';
import { messageFor } from '@/lib/api';
import { AVATARS } from '@/lib/avatars';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/theme';

const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

// TODO(step B): replace with the answers from the onboarding questions.
const PLACEHOLDER_ONBOARDING = {
  nativeLanguage: 'English',
  path: 'LIVING_IN_RWANDA',
  learnerRole: 'TOURIST',
  level: 'NEW',
  dailyGoalMinutes: 10,
};

export default function CreateAccount() {
  const params = useLocalSearchParams<{ for: string; birthYear: string }>();
  const isParent = params.for === 'child';
  const { signUp } = useSession();

  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0].id);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Checks on the phone give quick feedback; the API checks everything again.
  function problem(): string | null {
    if (!isParent && !nickname.trim()) return 'Please choose a nickname.';
    if (!email.includes('@')) return 'Please enter your email address.';
    if (!USERNAME_RULE.test(username.trim().toLowerCase())) return 'Usernames are 3 to 20 letters, numbers or _.';
    if (password.length < MIN_PASSWORD_LENGTH) return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
    return null;
  }

  async function submit() {
    const found = problem();
    if (found) {
      setError(found);
      return;
    }
    setBusy(true);
    setError(null);
    const account = {
      email: email.trim(),
      username: username.trim().toLowerCase(),
      password,
      birthYear: Number(params.birthYear),
    };
    const body = isParent
      ? { ...account, kind: 'PARENT' }
      : { ...account, kind: 'LEARNER', nickname: nickname.trim(), avatar, ...PLACEHOLDER_ONBOARDING };
    try {
      // On success the session changes and the navigator moves to Home by itself.
      await signUp(body);
    } catch (e) {
      setError(messageFor(e));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{isParent ? 'Create your parent account' : 'Save your progress'}</Title>
        <Body>
          {isParent
            ? "You'll add your child's profile next."
            : 'Create an account so your lessons and streak are saved.'}
        </Body>

        {!isParent && (
          <>
            <Field label="Nickname" value={nickname} onChangeText={setNickname} autoCapitalize="words" maxLength={40} />
            <Text style={styles.label}>Avatar</Text>
            <View style={styles.avatars}>
              {AVATARS.map((a) => (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={a.id}
                  accessibilityState={{ selected: avatar === a.id }}
                  onPress={() => setAvatar(a.id)}
                  style={[styles.avatar, avatar === a.id && styles.avatarSelected]}
                >
                  <Text style={styles.emoji}>{a.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label="Username" value={username} onChangeText={setUsername} autoComplete="username" maxLength={20} />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
        <ErrorText message={error} />
        <Button label="Create account" onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: { borderColor: colors.primary },
  emoji: { fontSize: 30 },
});
