import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AvatarPicker } from '@/components/avatar-picker';
import { Body, Button, Checkbox, Choice, ErrorText, Field, FormScreen, Title } from '@/components/ui';
import { apiRequest, messageFor } from '@/lib/api';
import { AVATARS } from '@/lib/avatars';
import type { DailyGoal, Level } from '@/lib/onboarding-draft';
import { AGE_RANGES, GOAL_OPTIONS, LEVEL_OPTIONS } from '@/lib/onboarding-options';
import { returnHome } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { colors, font, fonts, space } from '@/theme';

const PIN_RULE = /^\d{4}$/;

export default function AddChild() {
  const { token, me, refresh } = useSession();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[1].id);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('NEW');
  const [goal, setGoal] = useState<DailyGoal>(5);
  const [pin, setPin] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isFirstChild = (me?.profiles.length ?? 0) === 0;

  function problem(): string | null {
    if (!nickname.trim()) return "Please enter your child's nickname.";
    if (!ageRange) return "Please choose your child's age.";
    if (pin && !PIN_RULE.test(pin)) return 'A PIN is exactly 4 numbers, or leave it empty.';
    if (!consent) return 'Please confirm you are the parent or guardian.';
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
    try {
      await apiRequest('/profiles', {
        method: 'POST',
        token,
        body: {
          nickname: nickname.trim(),
          avatar,
          ageRange,
          level,
          dailyGoalMinutes: goal,
          consent: true,
          ...(pin ? { pin } : {}),
        },
      });
      await refresh();
      // Back to the profile picker: the parent decides when to hand over the phone.
      returnHome();
    } catch (e) {
      setError(messageFor(e));
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Title>{isFirstChild ? 'Add your child' : 'Add another child'}</Title>
      <Body>Your child learns on this profile. Only you can change it.</Body>

      <Field label="Child's nickname" value={nickname} onChangeText={setNickname} autoCapitalize="words" maxLength={40} />
      <AvatarPicker value={avatar} onChange={setAvatar} />

      <Text style={styles.label}>Age</Text>
      <View style={styles.row}>
        {AGE_RANGES.map((range) => (
          <View key={range} style={styles.cell}>
            <Choice label={range} selected={ageRange === range} onPress={() => setAgeRange(range)} />
          </View>
        ))}
      </View>

      <Text style={styles.label}>Kinyarwanda level</Text>
      {LEVEL_OPTIONS.map((option) => (
        <Choice key={option.value} label={option.label} selected={level === option.value} onPress={() => setLevel(option.value)} />
      ))}

      <Text style={styles.label}>Daily goal</Text>
      <View style={styles.row}>
        {GOAL_OPTIONS.map((option) => (
          <View key={option.minutes} style={styles.cell}>
            <Choice label={`${option.minutes} min`} selected={goal === option.minutes} onPress={() => setGoal(option.minutes)} />
          </View>
        ))}
      </View>

      <Field
        label="PIN (optional, 4 numbers)"
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
      />
      <Body>A PIN stops brothers and sisters opening this profile.</Body>

      <Checkbox label="I am this child's parent or guardian" checked={consent} onChange={setConsent} />
      <ErrorText message={error} />
      <Button label="Add child" onPress={submit} busy={busy} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.label, fontFamily: fonts.semibold, color: colors.text },
  row: { flexDirection: 'row', gap: space.sm },
  cell: { flex: 1 },
});
