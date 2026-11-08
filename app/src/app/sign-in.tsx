import { useState } from 'react';
import { Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { messageFor } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function SignIn() {
  const { signIn } = useSession();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!login.trim() || !password) {
      setError('Please enter your email or username, and your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // On success the session changes and the navigator moves to Home by itself.
      await signIn(login.trim(), password);
    } catch (e) {
      setError(messageFor(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Welcome back</Title>
      <Field label="Email or username" value={login} onChangeText={setLogin} autoComplete="username" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={submit}
      />
      <ErrorText message={error} />
      <Button label="Sign in" onPress={submit} busy={busy} />
    </Screen>
  );
}
