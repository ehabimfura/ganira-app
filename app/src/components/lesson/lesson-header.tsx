import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/ui';
import { displayProgress } from '@/lib/progress';
import { colors, font, fonts, icon, palette, radiusLarge, space } from '@/theme';

// The top of every lesson, as in Duolingo: an X to leave and a bar that fills up.
// Leaving asks first, because the lesson's progress is lost.
export function LessonHeader({ progress, onQuit }: { progress: number; onQuit: () => void }) {
  const [asking, setAsking] = useState(false);
  // The bar shows displayProgress(progress): it starts at 5% and speeds up early, then slows near the end.
  const shown = displayProgress(progress);
  const [width] = useState(() => new Animated.Value(shown));
  // The lesson screen does not leave room for the status bar or the Dynamic Island, so the
  // header makes that room itself.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(width, { toValue: shown, duration: 350, useNativeDriver: false }).start();
  }, [shown, width]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      <IconButton icon={X} label="Quit lesson" size={icon.large - 2} onPress={() => setAsking(true)} />
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      >
        <Animated.View
          style={[styles.fill, { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        >
          <View style={styles.shine} />
        </Animated.View>
      </View>

      <Modal transparent animationType="slide" visible={asking} onRequestClose={() => setAsking(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.sheetTitle}>Quit this lesson?</Text>
            <Text style={styles.sheetBody}>You will lose your progress in this lesson.</Text>
            <Button label="Keep learning" onPress={() => setAsking(false)} />
            <Button
              label="Quit"
              variant="secondary"
              onPress={() => {
                setAsking(false);
                onQuit();
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: palette.green, overflow: 'hidden' },
  shine: { position: 'absolute', top: 3, left: 8, right: 8, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF55' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  sheet: {
    gap: space.sm,
    padding: space.lg,
    paddingBottom: space.xl,
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusLarge,
    backgroundColor: colors.surface,
  },
  sheetTitle: { fontSize: font.title - 4, fontFamily: fonts.heading, color: colors.text, textAlign: 'center' },
  sheetBody: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginBottom: space.sm },
});
