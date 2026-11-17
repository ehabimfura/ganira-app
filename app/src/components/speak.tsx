import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { Mic, RotateCcw, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Button, ErrorText } from '@/components/ui';
import { messageFor } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useSession } from '@/lib/session';
import { useSuccessFeedback } from '@/lib/sounds';
import { checkSpeech, type SpeechResult } from '@/lib/speech';
import { colors, font, fonts, space } from '@/theme';

const MAX_RECORDING_MS = 10000;
// Recording stops by itself once the learner has spoken and then stays quiet this long.
const SILENCE_MS = 900;
const SPEAKING_DB = -38;
const QUIET_DB = -48;

// The speech model listens at 16 kHz in mono, so a small recording loses nothing
// and uploads quickly on mobile data.
const SPEECH_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
};

type Stage = 'idle' | 'recording' | 'checking' | 'done';

// The learner says the phrase; the words the speech check heard turn green.
// Every word green plays the chime and success vibration. There is no pass mark:
// after any try the learner may move on (onTried), or try again.
export function Speak({ expected, onTried }: { expected: string; onTried: (allHeard: boolean) => void }) {
  const { token } = useSession();
  const recorder = useAudioRecorder(SPEECH_RECORDING);
  const recorderState = useAudioRecorderState(recorder, 100);
  const success = useSuccessFeedback();
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopping = useRef(false);
  const heardVoice = useRef(false);
  const quietSince = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Stop on silence after speech, so the learner doesn't have to tap Stop.
  const level = recorderState.metering;
  useEffect(() => {
    if (stage !== 'recording' || level === undefined) return;
    if (level > SPEAKING_DB) {
      heardVoice.current = true;
      quietSince.current = null;
    } else if (heardVoice.current && level < QUIET_DB) {
      quietSince.current ??= Date.now();
      if (Date.now() - quietSince.current > SILENCE_MS) stop();
    }
  });

  const finishTry = (message: string | null, allHeard = false) => {
    setError(message);
    setStage('done');
    onTried(allHeard);
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
      heardVoice.current = false;
      quietSince.current = null;
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
      else haptics.tap();
      finishTry(null, answer.allHeard);
    } catch (e) {
      console.warn('Speech check failed', e);
      finishTry(messageFor(e));
    }
  }

  // A check where every word was heard: the phrase is replaced by "correct" and there is nothing to retry.
  const passed = result?.allHeard === true;

  return (
    <View style={styles.box}>
      {passed ? (
        <Text style={styles.correct} accessibilityLabel="Correct">
          correct
        </Text>
      ) : result ? (
        <Text
          style={styles.words}
          accessibilityLabel={`Heard: ${result.words.filter((w) => w.heard).length} of ${result.words.length} words`}
        >
          {result.words.map((w, i) => (
            <Text key={i} style={w.heard ? styles.heard : styles.missed}>
              {w.word}{' '}
            </Text>
          ))}
        </Text>
      ) : stage === 'recording' || stage === 'checking' ? (
        <PendingPhrase expected={expected} />
      ) : null}
      <ErrorText message={error} />
      {stage === 'recording' && <ListeningDots level={level} />}
      {stage === 'checking' && <ListeningDots checking />}
      {stage === 'recording' ? (
        <Button label="Stop" icon={Square} onPress={stop} />
      ) : passed ? null : (
        <Button
          label={stage === 'idle' ? 'Speak' : 'Try again'}
          icon={stage === 'idle' ? Mic : RotateCcw}
          variant={stage === 'idle' ? 'primary' : 'secondary'}
          busy={stage === 'checking'}
          onPress={start}
        />
      )}
    </View>
  );
}

const SWEEP_MS = 800;

// While the learner speaks and the check runs, the phrase is grey: nothing is heard yet.
// A lighter band wipes across it from left to right, again and again, until the result comes.
function PendingPhrase({ expected }: { expected: string }) {
  const [width, setWidth] = useState(0);
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.timing(sweep, { toValue: 1, duration: SWEEP_MS, easing: Easing.linear, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const words = expected.split(/\s+/);
  const phrase = (style: TextStyle) =>
    words.map((word, i) => (
      <Text key={i} style={style}>
        {word}{' '}
      </Text>
    ));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={`Your phrase: ${expected}`}>
      <Text style={styles.words}>{phrase(styles.pending)}</Text>
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.sweep, { width: sweep.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        >
          <Text style={[styles.words, { width }]}>{phrase(styles.sweepText)}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const DOTS = 5;

// Dots that bounce up and down while the microphone is on. They jump higher when the
// learner speaks louder; while the recording is checked they ripple gently in grey.
function ListeningDots({ level, checking = false }: { level?: number; checking?: boolean }) {
  const [waves] = useState(() => Array.from({ length: DOTS }, () => new Animated.Value(0)));

  useEffect(() => {
    const loops = waves.map((wave, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 110),
          Animated.timing(wave, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((DOTS - i) * 110),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [waves]);

  // -60 dB (a quiet room) to -20 dB (clear speech) becomes a jump of 6 to 22 px.
  const loudness = level === undefined ? 0.4 : Math.min(1, Math.max(0, (level + 60) / 40));
  const jump = checking ? 5 : 6 + loudness * 16;

  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={checking ? 'Checking what you said' : 'Recording. Speak now.'}
      accessibilityLiveRegion="polite"
    >
      {waves.map((wave, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            checking && styles.dotChecking,
            { transform: [{ translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -jump] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  words: { fontSize: font.body + 4, fontFamily: fonts.regular, textAlign: 'center' },
  heard: { color: colors.success, fontFamily: fonts.bold },
  // Words the check did not hear: red, so a wrong try is visible at once.
  missed: { color: colors.error, fontFamily: fonts.semibold },
  pending: { color: colors.muted, fontFamily: fonts.semibold, opacity: 0.4 },
  sweep: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },
  sweepText: { color: colors.muted, fontFamily: fonts.semibold },
  correct: { fontSize: font.body + 8, fontFamily: fonts.bold, color: colors.success, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 10, height: 40, paddingBottom: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success },
  dotChecking: { backgroundColor: colors.borderStrong },
});
