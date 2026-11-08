import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { isAdult, parseBirthYear } from '@/lib/age';

export default function BirthYear() {
  const params = useLocalSearchParams<{ for: string }>();
  const forWhom = params.for === 'child' ? 'child' : 'me';
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const year = parseBirthYear(text.trim());
    if (year === null) {
      setError('Please enter a year with 4 digits, like 1990.');
      return;
    }
    // Under 18: nothing is saved, and no email is asked for.
    if (!isAdult(year)) {
      router.replace({ pathname: '/under-age', params: { for: forWhom } });
      return;
    }
    router.push({ pathname: '/create-account', params: { for: forWhom, birthYear: String(year) } });
  };

  return (
    <Screen>
      {/* The age limit is not shown on purpose. */}
      <Title>{forWhom === 'child' ? 'What year were you born? (parent or guardian)' : 'What year were you born?'}</Title>
      <Field
        label="Birth year"
        placeholder="YYYY"
        keyboardType="number-pad"
        maxLength={4}
        value={text}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        onSubmitEditing={next}
      />
      <ErrorText message={error} />
      <Button label="Continue" onPress={next} disabled={text.length !== 4} />
    </Screen>
  );
}
