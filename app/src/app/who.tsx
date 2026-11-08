import { router } from 'expo-router';
import { Body, Button, Screen, Title } from '@/components/ui';

export default function Who() {
  const choose = (forWhom: 'me' | 'child') => router.push({ pathname: '/birth-year', params: { for: forWhom } });

  return (
    <Screen>
      <Title>Who is Ganira for?</Title>
      <Body>Children learn on a profile that their parent or guardian sets up.</Body>
      <Button label="Me" onPress={() => choose('me')} />
      <Button label="My child" variant="secondary" onPress={() => choose('child')} />
    </Screen>
  );
}
