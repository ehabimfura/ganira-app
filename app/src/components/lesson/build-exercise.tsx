import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SpeakerButton } from '@/components/lesson/choice-exercise';
import { CheckFooter, type CheckState } from '@/components/lesson/check-footer';
import type { Line } from '@/content/unit1';
import { haptics } from '@/lib/haptics';
import { useClipPlayer, useSuccessFeedback } from '@/lib/sounds';
import { colors, font, fonts, radius, space } from '@/theme';

// Tiles show words as written ("Remera" keeps its capital) without punctuation;
// the check ignores capitals, so "I" and "i" are the same tile.
const tileWord = (word: string) => word.replace(/[^\p{L}]/gu, '');
const bare = (word: string) => tileWord(word).toLowerCase();

// Build: hear a phrase and see its meaning, then tap its words into order.
// Punctuation and capitals don't count; decoy words make the learner listen.
export function BuildExercise({ line, extra, onDone }: { line: Line; extra: string[]; onDone: (correct: boolean) => void }) {
  const play = useClipPlayer();
  const success = useSuccessFeedback();
  const words = useMemo(() => line.text.split(/\s+/).map(tileWord), [line]);
  // Tiles in a fixed mixed order: every other word from the end, then the rest, then decoys.
  const bank = useMemo(() => {
    const all = [...words, ...extra.map(tileWord)];
    return [...all.filter((_, i) => i % 2 === 1), ...all.filter((_, i) => i % 2 === 0)];
  }, [words, extra]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [state, setState] = useState<CheckState>('unanswered');

  useEffect(() => {
    play(line.audio);
  }, [play, line.audio]);

  const check = () => {
    const right = chosen.map((i) => bare(bank[i])).join(' ') === words.map(bare).join(' ');
    setState(right ? 'correct' : 'wrong');
    if (right) success();
    else haptics.wrong();
  };

  const locked = state !== 'unanswered';
  const tile = (index: number, onPress: () => void) => (
    <Pressable
      key={index}
      testID={`tile-${index}`}
      accessibilityRole="button"
      accessibilityLabel={bank[index]}
      disabled={locked}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <Text style={styles.tileText}>{bank[index]}</Text>
    </Pressable>
  );

  return (
    <View style={styles.flex}>
      <Text style={styles.prompt}>Put the words in order</Text>
      <View style={styles.listen}>
        <SpeakerButton size="small" onPress={() => play(line.audio)} />
        <Text style={styles.meaning}>{line.meaning}</Text>
      </View>
      <View
        style={[
          styles.answer,
          state === 'correct' && { borderColor: colors.success },
          state === 'wrong' && { borderColor: colors.error },
        ]}
        accessibilityLabel={`Your answer: ${chosen.map((i) => bank[i]).join(' ') || 'empty'}`}
      >
        {chosen.map((index) => tile(index, () => setChosen(chosen.filter((i) => i !== index))))}
      </View>
      <View style={styles.bank}>
        {bank.map((word, index) =>
          chosen.includes(index) ? (
            <View key={index} style={[styles.tile, styles.placeholder]}>
              <Text style={[styles.tileText, styles.hidden]}>{word}</Text>
            </View>
          ) : (
            tile(index, () => setChosen([...chosen, index]))
          ),
        )}
      </View>
      <View style={styles.flex} />
      <CheckFooter
        state={state}
        canCheck={chosen.length > 0}
        onCheck={check}
        onContinue={() => onDone(state === 'correct')}
        answer={line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  prompt: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
  listen: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meaning: { flex: 1, fontSize: font.body, fontFamily: fonts.semibold, color: colors.muted },
  answer: {
    minHeight: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    paddingVertical: space.sm,
    borderBottomWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.border,
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, justifyContent: 'center' },
  tile: {
    paddingHorizontal: space.sm,
    paddingVertical: 10,
    borderRadius: radius,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tilePressed: { borderBottomWidth: 2, marginTop: 2 },
  placeholder: { backgroundColor: colors.border, borderColor: colors.border },
  tileText: { fontSize: font.body, fontFamily: fonts.semibold, color: colors.text },
  hidden: { opacity: 0 },
});
