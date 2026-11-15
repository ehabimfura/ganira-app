import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import type { Line } from '@/content/unit1';
import { haptics } from '@/lib/haptics';
import { useClipPlayer, useSuccessFeedback } from '@/lib/sounds';
import { colors, font, fonts, radius, space } from '@/theme';

type Side = 'kin' | 'en';
type Pick = { side: Side; index: number };

// Match pairs: tap a Kinyarwanda phrase and its meaning. A right pair turns green and
// fades; a wrong pair flashes red. Any wrong pair sends the exercise back at the end.
export function PairsExercise({ lines, onDone }: { lines: Line[]; onDone: (correct: boolean) => void }) {
  const play = useClipPlayer();
  const success = useSuccessFeedback();
  // English meanings in a different order from the Kinyarwanda, but the same every time.
  const meanings = useMemo(() => lines.map((_, i) => lines[(i + 1) % lines.length]).reverse(), [lines]);
  const [picked, setPicked] = useState<Pick | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<Pick[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const finished = matched.size === lines.length;

  useEffect(() => {
    if (!flash.length) return;
    const timer = setTimeout(() => setFlash([]), 600);
    return () => clearTimeout(timer);
  }, [flash]);

  const lineIndex = (p: Pick) => (p.side === 'kin' ? p.index : lines.indexOf(meanings[p.index]));

  const tap = (p: Pick) => {
    if (p.side === 'kin') play(lines[p.index].audio);
    if (!picked || picked.side === p.side) {
      haptics.tap();
      setPicked(p);
      return;
    }
    if (lineIndex(picked) === lineIndex(p)) {
      const next = new Set(matched).add(lineIndex(p));
      setMatched(next);
      if (next.size === lines.length) success();
      else haptics.correct();
    } else {
      haptics.wrong();
      setMistakes((m) => m + 1);
      setFlash([picked, p]);
    }
    setPicked(null);
  };

  const tile = (p: Pick, label: string) => {
    const done = matched.has(lineIndex(p));
    const isPicked = picked?.side === p.side && picked.index === p.index;
    const isWrong = flash.some((f) => f.side === p.side && f.index === p.index);
    return (
      <Pressable
        key={`${p.side}${p.index}`}
        testID={`pair-${p.side}-${p.index}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: done, selected: isPicked }}
        disabled={done}
        onPress={() => tap(p)}
        style={[styles.tile, isPicked && styles.picked, isWrong && styles.wrong, done && styles.done]}
      >
        <Text style={[styles.tileText, isWrong && { color: colors.error }, done && { color: colors.success }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.flex}>
      <Text style={styles.prompt}>Tap the matching pairs</Text>
      <View style={styles.columns}>
        <View style={styles.column}>{lines.map((l, i) => tile({ side: 'kin', index: i }, l.text))}</View>
        <View style={styles.column}>{meanings.map((l, i) => tile({ side: 'en', index: i }, l.meaning))}</View>
      </View>
      <View style={styles.flex} />
      {finished && <Button label="Continue" variant="success" onPress={() => onDone(mistakes === 0)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  prompt: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
  columns: { flexDirection: 'row', gap: space.sm },
  column: { flex: 1, gap: space.sm },
  tile: {
    minHeight: 64,
    justifyContent: 'center',
    padding: space.sm,
    borderRadius: radius + 2,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  picked: { borderColor: colors.primary, backgroundColor: colors.selected },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  done: { borderColor: colors.success, backgroundColor: colors.successSoft, opacity: 0.5 },
  tileText: { fontSize: font.body - 1, fontFamily: fonts.semibold, color: colors.text, textAlign: 'center' },
});
