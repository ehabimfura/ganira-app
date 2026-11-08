import { router, useLocalSearchParams } from 'expo-router';
import { Body, Button, Screen, Title } from '@/components/ui';

export default function UnderAge() {
  const params = useLocalSearchParams<{ for: string }>();

  if (params.for === 'child') {
    // A parent who typed their child's year by mistake can go back and fix it.
    return (
      <Screen>
        <Title>A parent or guardian sets this up</Title>
        <Body>Only a parent or guardian aged 18 or over can set up Ganira for a child. Please enter your own birth year.</Body>
        <Button label="Back" onPress={() => router.replace({ pathname: '/birth-year', params: { for: 'child' } })} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Ask a parent or guardian</Title>
      <Body>Ask a parent or guardian to set up Ganira for you. They can make a profile for you on their account.</Body>
      <Button label="OK" onPress={() => router.replace('/welcome')} />
    </Screen>
  );
}
