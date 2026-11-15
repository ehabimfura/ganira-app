import { Lightbulb, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpeakerButton } from '@/components/lesson/choice-exercise';
import { Speak } from '@/components/speak';
import { Button } from '@/components/ui';
import type { Line } from '@/content/unit1';
import { useClipPlayer } from '@/lib/sounds';
import { colors, font, fonts, icon, palette, radiusLarge, shadow, space } from '@/theme';

// A new phrase: it plays at once, then the learner says it. Continue appears after any try.
export function IntroduceExercise({ line, onDone }: { line: Line; onDone: () => void }) {
  const play = useClipPlayer();
  const [spoke, setSpoke] = useState(false);

  useEffect(() => {
    play(line.audio);
  }, [play, line.audio]);

  return (
    <View style={styles.flex}>
      <View style={styles.tag}>
        <Sparkles size={16} color={palette.purple} strokeWidth={icon.stroke} />
        <Text style={styles.tagText}>New phrase</Text>
      </View>
      <View style={styles.card}>
        {line.audio ? <SpeakerButton onPress={() => play(line.audio)} /> : null}
        <Text style={styles.phrase}>{line.text}</Text>
        <Text style={styles.meaning}>{line.meaning}</Text>
      </View>
      <Text style={styles.hint}>Say it out loud</Text>
      <Speak expected={line.text} onTried={() => setSpoke(true)} />
      {spoke && <Button label="Continue" variant="success" onPress={onDone} />}
    </View>
  );
}

// Recall: only the English shows. Saying it from memory is what makes it stick
// (retrieval practice). A learner who is stuck can hear the answer first.
// Remembered means every word was heard before the learner asked to hear the answer.
export function RecallExercise({ line, onDone }: { line: Line; onDone: (remembered: boolean) => void }) {
  const play = useClipPlayer();
  const [revealed, setRevealed] = useState(false);
  const [tried, setTried] = useState(false);
  const [remembered, setRemembered] = useState(false);

  return (
    <View style={styles.flex}>
      <Text style={styles.prompt}>Say this in Kinyarwanda</Text>
      <View style={styles.card}>
        <Text style={styles.phrase}>“{line.meaning}”</Text>
        {revealed && <Text style={styles.answer}>{line.text}</Text>}
        {line.audio && revealed ? <SpeakerButton size="small" onPress={() => play(line.audio)} /> : null}
      </View>
      <Speak
        expected={line.text}
        onTried={(allHeard) => {
          if (!tried) setRemembered(allHeard && !revealed);
          setTried(true);
          setRevealed(true);
        }}
      />
      {line.audio && !revealed ? (
        <Button
          label="Hear the answer"
          icon={Lightbulb}
          variant="secondary"
          onPress={() => {
            play(line.audio);
            setRevealed(true);
          }}
        />
      ) : null}
      {tried && <Button label="Continue" variant="success" onPress={() => onDone(remembered)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  tagText: { fontSize: font.label, fontFamily: fonts.bold, color: palette.purple, textTransform: 'uppercase', letterSpacing: 0.6 },
  prompt: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    borderRadius: radiusLarge,
    backgroundColor: colors.surface,
    ...shadow,
  },
  phrase: { fontSize: font.title, fontFamily: fonts.heading, color: colors.text, textAlign: 'center' },
  meaning: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },
  answer: { fontSize: font.body + 2, fontFamily: fonts.headingBold, color: colors.success, textAlign: 'center' },
  hint: { fontSize: font.body, fontFamily: fonts.semibold, color: colors.muted, textAlign: 'center' },
});
