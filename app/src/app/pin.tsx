import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { apiRequest, messageFor } from '@/lib/api';
import { returnHome } from '@/lib/navigation';
import { useSession } from '@/lib/session';


// Opens a PIN-locked child profile.
export default function Pin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, me, refresh } = useSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const profile = me?.profiles.find((p) => String(p.id) === id);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/profiles/${id}/select`, { method: 'POST', token, body: { pin } });
      await refresh();
      returnHome();
    } catch (e) {
      setError(messageFor(e));
      setPin('');
      setBusy(false);
    }
  }

  return (
    <Screen>
      {profile ? (
        <View style={styles.avatar}>
          <Avatar id={profile.avatar} size={88} />
        </View>
      ) : null}
      <Title>{profile ? `${profile.nickname}'s PIN` : 'PIN'}</Title>
      <Field
        label="PIN"
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        onSubmitEditing={submit}
        autoFocus
      />
      <ErrorText message={error} />
      <Button label="Open" onPress={submit} busy={busy} disabled={pin.length !== 4} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center' },
});
