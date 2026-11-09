import { useState } from 'react';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { apiRequest, messageFor } from '@/lib/api';
import { returnHome } from '@/lib/navigation';
import { useSession } from '@/lib/session';

// Leaves a child's profile. Only the parent's password does this, so a child
// can't wander into a sibling's profile or the parent's settings.
export default function ParentUnlock() {
  const { token, refresh } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/parent/unlock', { method: 'POST', token, body: { password } });
      await refresh();
      returnHome();
    } catch (e) {
      setError(messageFor(e));
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Parent</Title>
      <Body>Enter your password to leave this profile.</Body>
      <Field
        label="Parent password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={submit}
      />
      <ErrorText message={error} />
      <Button label="Continue" onPress={submit} busy={busy} disabled={!password} />
    </Screen>
  );
}
