import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen } from '@/components/ui';
import { colors, font, space } from '@/theme';

export default function Welcome() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Muraho!</Text>
        <Body>Speak Kinyarwanda from your very first lesson.</Body>
      </View>
      <Button label="Get started" onPress={() => router.push('/who')} />
      <Button label="I already have an account" variant="secondary" onPress={() => router.push('/sign-in')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: space.sm },
  greeting: { fontSize: font.hero, fontWeight: '800', color: colors.primary },
});
