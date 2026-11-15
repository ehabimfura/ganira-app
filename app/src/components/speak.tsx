import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorText } from '@/components/ui';
import { messageFor } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useSuccessFeedback } from '@/lib/sounds';
import { checkSpeech, type SpeechResult } from '@/lib/speech';
import { colors, font, fonts, space } from '@/theme';

const MAX_RECORDING_MS = 10000;

type Stage = 'idle' | 'recording' | 'checking' | 'done';

// The learner says the phrase; the words the speech check heard turn green.
// Every word green plays the chime and success vibration. There is no pass mark:
// after any try the learner may move on (onTried), or try again.
export function Speak({ expected, onTried }: { expected: string; onTried: () => void }) {
  const { token } = useSession();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const success = useSuccessFeedback();
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopping = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const finishTry = (message: string | null) => {
    setError(message);
    setStage('done');
    onTried();
  };

  async function start() {
    setError(null);
    setResult(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        finishTry('Ganira needs the microphone to hear you. You can allow it in Settings.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      stopping.current = false;
      setStage('recording');
      timer.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch (e) {
      console.warn('Could not start recording', e);
      finishTry("The microphone couldn't start. Please try again.");
    }
  }

  async function stop() {
    if (stopping.current) return;
    stopping.current = true;
    if (timer.current) clearTimeout(timer.current);
    setStage('checking');
    try {
      await recorder.stop();
      if (!recorder.uri) throw new Error('No recording was saved');
      const answer = await checkSpeech(recorder.uri, expected, token);
      setResult(answer);
      if (answer.allHeard) success();
      finishTry(null);
    } catch (e) {
      console.warn('Speech check failed', e);
      finishTry(messageFor(e));
    }
  }

  return (
    <View style={styles.box}>
      {result && (
        <Text style={styles.words} accessibilityLabel={`Heard: ${result.words.filter((w) => w.heard).length} of ${result.words.length} words`}>
          {result.words.map((w, i) => (
            <Text key={i} style={w.heard ? styles.heard : styles.missed}>
              {w.word}{' '}
            </Text>
          ))}
        </Text>
      )}
      <ErrorText message={error} />
      {stage === 'recording' ? (
        <Button label="■ Stop" onPress={stop} />
      ) : (
        <Button
          label={stage === 'idle' ? '🎙️ Speak' : '🎙️ Try again'}
          variant={stage === 'idle' ? 'primary' : 'secondary'}
          busy={stage === 'checking'}
          onPress={start}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  words: { fontSize: font.body + 4, fontFamily: fonts.regular, textAlign: 'center' },
  heard: { color: colors.success, fontFamily: fonts.bold },
  missed: { color: colors.muted, fontFamily: fonts.semibold, opacity: 0.55 },
});
