import { useAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Speak } from '@/components/speak';
import { Body, Button, Screen, Title } from '@/components/ui';
import { useSession } from '@/lib/session';
import { colors, font, fonts, space } from '@/theme';

// Speaking in the first seconds: hear "Muraho" in the lesson voice, then say it.
// There is no skip and no "I said it" button: the speech check hears the learner,
// and only a fully heard word plays the chime and success vibration.
export default function FirstLesson() {
  const { status } = useSession();
  const voice = useAudioPlayer(require('../../assets/audio/muraho.wav'));
  const [heard, setHeard] = useState(false);
  const [spoke, setSpoke] = useState(false);

  const listen = () => {
    // A missing speaker or a blocked browser must never stop the lesson.
    try {
      voice.seekTo(0);
      voice.play();
    } catch (error) {
      console.warn('Could not play sound', error);
    }
    setHeard(true);
  };

  // New learners go on to save their progress; signed-in learners return to their path.
  const next = () => {
    if (status === 'signedIn') router.back();
    else router.push({ pathname: '/create-account', params: { for: 'me' } });
  };

  return (
    <Screen>
      <Title>Your first word</Title>
      <View style={styles.card}>
        <Text style={styles.word}>Muraho</Text>
        <Text style={styles.meaning}>Hello</Text>
      </View>

      <Button label="Listen" icon={Volume2} variant="secondary" onPress={listen} />

      {heard && (
        <>
          <Body>Now say it out loud!</Body>
          <Speak expected="Muraho" onTried={() => setSpoke(true)} />
          {spoke && <Button label="Continue" onPress={next} />}
        </>
      )}
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
  word: { fontSize: font.hero, fontFamily: fonts.heading, color: colors.text },
  meaning: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted },
});
