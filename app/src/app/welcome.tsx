import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen } from '@/components/ui';
import { colors, font, fonts, space } from '@/theme';

export default function Welcome() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Muraho!</Text>
        <Body>Speak Kinyarwanda from your very first lesson.</Body>
      </View>
      <Button label="Get started" onPress={() => router.push('/who')} />
      <Button label="I already have an account" variant="secondary" onPress={() => router.push('/sign-in')} />
      <Text style={styles.credits} onPress={() => router.push('/credits')} accessibilityRole="link">
        Credits
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: space.sm },
  greeting: { fontSize: font.hero, fontFamily: fonts.heading, color: colors.primary, lineHeight: font.hero * 1.6 },
  credits: { textAlign: 'center', color: colors.muted, fontSize: font.label, fontFamily: fonts.regular, padding: space.sm },
});
