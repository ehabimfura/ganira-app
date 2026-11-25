import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { getSettings } from '@/lib/settings';

// Vibration patterns for phones. The timings follow web-haptics' presets
// (https://github.com/lochie/web-haptics, MIT); the web build uses that library
// itself (haptics.web.ts). A phone without haptics simply stays still.

type Tap = { at: number; style: Haptics.ImpactFeedbackStyle };
const { Light, Medium, Heavy, Rigid } = Haptics.ImpactFeedbackStyle;

function taps(pattern: Tap[]): void {
  for (const { at, style } of pattern) {
    setTimeout(() => {
      Haptics.impactAsync(style).catch(() => {});
    }, at);
  }
}

// Android can set each buzz's length, which feels stronger than its short ticks.
function androidBuzz(pattern: number[]): boolean {
  if (Platform.OS !== 'android') return false;
  Vibration.vibrate(pattern);
  return true;
}

// Vibration can be switched off on the profile screen (FR 5.6).
const on = () => getSettings().vibration;

export const haptics = {
  // A button or tile press.
  tap: () => {
    if (on()) Haptics.selectionAsync().catch(() => {});
  },
  // A right answer: a soft tap, then a strong one.
  correct: () => {
    if (!on()) return;
    if (!androidBuzz([0, 30, 60, 40])) taps([{ at: 0, style: Light }, { at: 60, style: Heavy }]);
  },
  // A wrong answer: three sharp taps.
  wrong: () => {
    if (!on()) return;
    if (!androidBuzz([0, 40, 40, 40, 40, 50])) {
      taps([{ at: 0, style: Rigid }, { at: 80, style: Rigid }, { at: 160, style: Medium }]);
    }
  },
  // A finished lesson: a quick rising drum roll that ends in one long, strong buzz.
  celebrate: () => {
    if (!on()) return;
    if (androidBuzz([0, 25, 70, 30, 60, 35, 50, 45, 40, 220])) return;
    taps([
      { at: 0, style: Light },
      { at: 95, style: Light },
      { at: 185, style: Medium },
      { at: 270, style: Medium },
      { at: 350, style: Heavy },
      { at: 430, style: Heavy },
    ]);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 560);
  },
};
