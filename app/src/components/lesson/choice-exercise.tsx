import { Volume2 } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { CheckFooter, type CheckState } from '@/components/lesson/check-footer';
import { Choice, type ChoiceStatus } from '@/components/ui';
import type { Line } from '@/content/unit1';
import { haptics } from '@/lib/haptics';
import { MOTARI_ID } from '@/lib/avatars';
import { useClipPlayer, useSuccessFeedback, useWrongFeedback } from '@/lib/sounds';
import { colors, font, fonts, icon, palette, radiusLarge, space } from '@/theme';

// A fixed order (not random), with the right answer's place varying from exercise to exercise.
function placeAnswer<T>(answer: T, wrong: T[], key: string): T[] {
  const at = key.length % (wrong.length + 1);
  return [...wrong.slice(0, at), answer, ...wrong.slice(at)];
}

// Listen: hear Kinyarwanda (the learner's voice or the motari's), pick the English meaning.
export function ListenExercise({
  line,
  wrong,
  speaker,
  onDone,
}: {
  line: Line;
  wrong: string[];
  speaker?: 'motari';
  onDone: (correct: boolean) => void;
}) {
  const play = useClipPlayer();
  const options = useMemo(() => placeAnswer(line.meaning, wrong, line.text), [line, wrong]);

  useEffect(() => {
    play(line.audio);
  }, [play, line.audio]);

  return (
    <ChoiceQuiz
      prompt={speaker === 'motari' ? 'The motari says something. What does it mean?' : 'What does this mean?'}
      options={options}
      answer={line.meaning}
      line={line}
      onDone={onDone}
      header={
        <View style={styles.listenRow}>
          {speaker === 'motari' && (
            <View accessibilityLabel="Motari">
              <Avatar id={MOTARI_ID} size={64} />
            </View>
          )}
          <SpeakerButton onPress={() => play(line.audio)} />
        </View>
      }
      revealText={line.text}
    />
  );
}

// Read: see the English, pick the Kinyarwanda. Each option plays its sound when tapped.
export function ReadExercise({ line, wrong, onDone }: { line: Line; wrong: Line[]; onDone: (correct: boolean) => void }) {
  const play = useClipPlayer();
  const options = useMemo(() => placeAnswer(line, wrong, line.meaning), [line, wrong]);
  return (
    <ChoiceQuiz
      prompt="How do you say this?"
      options={options.map((o) => o.text)}
      answer={line.text}
      line={line}
      onDone={onDone}
      onPick={(text) => play(options.find((o) => o.text === text)?.audio)}
      header={<Text style={styles.english}>“{line.meaning}”</Text>}
    />
  );
}

function ChoiceQuiz({
  prompt,
  header,
  options,
  answer,
  line,
  revealText,
  onPick,
  onDone,
}: {
  prompt: string;
  header: ReactNode;
  options: string[];
  answer: string;
  line: Line;
  revealText?: string;
  onPick?: (option: string) => void;
  onDone: (correct: boolean) => void;
}) {
  const success = useSuccessFeedback();
  const wrong = useWrongFeedback();
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<CheckState>('unanswered');

  const check = () => {
    const right = picked === answer;
    setState(right ? 'correct' : 'wrong');
    if (right) success();
    else wrong();
  };

  // Before checking, the pick is highlighted. After, the right option is green and a wrong pick red.
  const statusOf = (option: string): ChoiceStatus => {
    if (state === 'unanswered') return option === picked ? 'selected' : 'none';
    if (option === answer) return 'correct';
    return option === picked ? 'wrong' : 'none';
  };

  return (
    <View style={styles.flex}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.card}>
        {header}
        {revealText && state !== 'unanswered' ? <Text style={styles.reveal}>{revealText}</Text> : null}
      </View>
      <View style={styles.options}>
        {options.map((option) => (
          <Choice
            key={option}
            label={option}
            status={statusOf(option)}
            disabled={state !== 'unanswered'}
            onPress={() => {
              setPicked(option);
              onPick?.(option);
            }}
          />
        ))}
      </View>
      <CheckFooter
        state={state}
        canCheck={picked !== null}
        onCheck={check}
        onContinue={() => onDone(state === 'correct')}
        answer={line}
      />
    </View>
  );
}

export function SpeakerButton({ onPress, size = 'large' }: { onPress: () => void; size?: 'large' | 'small' }) {
  const big = size === 'large';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play the sound again"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.speaker, big ? styles.speakerLarge : styles.speakerSmall, pressed && styles.speakerPressed]}
    >
      <Volume2 size={big ? 40 : icon.size} color={colors.primaryText} strokeWidth={icon.stroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  prompt: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, minHeight: 140 },
  listenRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  english: { fontSize: font.title, fontFamily: fonts.heading, color: colors.text, textAlign: 'center' },
  reveal: { fontSize: font.body + 2, fontFamily: fonts.headingBold, color: colors.muted },
  options: { gap: space.sm },
  speaker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.blue,
    borderBottomWidth: 5,
    borderBottomColor: '#24406A',
  },
  speakerLarge: { width: 96, height: 96, borderRadius: radiusLarge + 6 },
  speakerSmall: { width: 48, height: 48, borderRadius: radiusLarge - 4, borderBottomWidth: 3 },
  speakerPressed: { borderBottomWidth: 0, marginTop: 5 },
});
