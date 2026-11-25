import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { palette } from '@/theme';

const PIECES = 36;
const COLORS = [palette.green, palette.yellow, palette.cyan, palette.blue];

// Paper pieces that fall once over the screen when a lesson is finished.
// Positions follow a fixed pattern, so the screen looks the same every time.
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const [fall] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fall]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: PIECES }, (_, i) => {
        const x = ((i * 37) % 100) / 100;
        const drift = ((i % 7) - 3) * 18;
        const start = -40 - ((i * 53) % 160);
        const spin = (i % 2 ? 1 : -1) * (360 + (i % 5) * 120);
        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                left: x * width,
                backgroundColor: COLORS[i % COLORS.length],
                width: i % 3 ? 8 : 12,
                height: i % 3 ? 14 : 8,
                opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
                transform: [
                  { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [start, height * 0.9] }) },
                  { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
                  { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] }) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderRadius: 2 },
});
