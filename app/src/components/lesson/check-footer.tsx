import { Check, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors, font, fonts, radius, space } from '@/theme';

export type CheckState = 'unanswered' | 'correct' | 'wrong';

// The bar under a quiz exercise, as in Duolingo: CHECK, then green or red with the
// answer, then CONTINUE. It never says "well done"; the color, sound and vibration
// carry the feedback, and the text only shows the answer.
export function CheckFooter({
  state,
  canCheck,
  onCheck,
  onContinue,
  answer,
}: {
  state: CheckState;
  canCheck: boolean;
  onCheck: () => void;
  onContinue: () => void;
  answer: { text: string; meaning: string };
}) {
  if (state === 'unanswered') {
    return (
      <View style={styles.bar}>
        <Button label="Check" onPress={onCheck} disabled={!canCheck} />
      </View>
    );
  }
  const right = state === 'correct';
  const tint = right ? colors.success : colors.error;
  const Icon = right ? Check : X;
  return (
    <View
      style={[styles.bar, styles.feedback, { backgroundColor: right ? colors.successSoft : colors.errorSoft }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: tint }]}>
          <Icon size={20} color={colors.primaryText} strokeWidth={3} />
        </View>
        <View style={styles.flex}>
          {!right && <Text style={[styles.heading, { color: tint }]}>Correct answer:</Text>}
          <Text style={[styles.answer, { color: tint }]}>{answer.text}</Text>
          <Text style={[styles.meaning, { color: tint }]}>{answer.meaning}</Text>
        </View>
      </View>
      <Button label="Continue" variant={right ? 'success' : 'danger'} onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: space.sm, paddingTop: space.sm },
  feedback: { marginHorizontal: -space.lg, marginBottom: -space.lg, padding: space.lg, borderTopLeftRadius: radius, borderTopRightRadius: radius },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  heading: { fontSize: font.label, fontFamily: fonts.bold },
  answer: { fontSize: font.body + 2, fontFamily: fonts.headingBold },
  meaning: { fontSize: font.label, fontFamily: fonts.regular },
});
