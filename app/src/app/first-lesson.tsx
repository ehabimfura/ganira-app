import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen, Title } from '@/components/ui';
import { colors, font, space } from '@/theme';

type Step = 'listen' | 'say' | 'done';

// Speaking in the first seconds: hear "Muraho" in the lesson voice, say it, move on.
// There is no skip. Until the speech check arrives, the learner taps "I said it".
export default function FirstLesson() {
  const voice = useAudioPlayer(require('../../assets/audio/muraho.wav'));
  const chime = useAudioPlayer(require('../../assets/audio/chime.wav'));
  const [step, setStep] = useState<Step>('listen');

  const play = (player: typeof voice) => {
    // A missing speaker or a blocked browser must never stop the lesson.
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.warn('Could not play sound', error);
    }
  };

  const listen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    play(voice);
    if (step === 'listen') setStep('say');
  };

  const saidIt = () => {
    play(chime);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStep('done');
  };

  return (
    <Screen>
      <Title>Your first word</Title>
      <View style={styles.card}>
        <Text style={styles.word}>Muraho</Text>
        <Text style={styles.meaning}>Hello</Text>
        {step === 'done' && (
          <Text style={styles.tick} accessibilityLabel="Done">
            ✓
          </Text>
        )}
      </View>

      <Button label="🔊 Listen" variant="secondary" onPress={listen} />

      {step === 'say' && (
        <>
          <Body>Now say it out loud!</Body>
          <Button label="I said it" onPress={saidIt} />
        </>
      )}
      {step === 'done' && <Button label="Continue" onPress={() => router.push({ pathname: '/create-account', params: { for: 'me' } })} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  word: { fontSize: font.hero, fontWeight: '800', color: colors.text },
  meaning: { fontSize: font.body, color: colors.muted },
  tick: { fontSize: font.hero, color: colors.primary },
});
