import { useAudioPlayer, type AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

// A missing speaker or a browser that blocks sound must never stop a lesson,
// so failures are logged and the lesson carries on.

// One player for all the lesson clips: play(clip) stops whatever was playing.
// A line with no recording yet (clip undefined) plays nothing.
export function useClipPlayer(): (clip: AudioSource | undefined) => void {
  const player = useAudioPlayer(null);
  return useCallback(
    (clip: AudioSource | undefined) => {
      if (!clip) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      try {
        player.replace(clip);
        player.play();
      } catch (error) {
        console.warn('Could not play sound', error);
      }
    },
    [player],
  );
}

// Feedback is a sound and a vibration, never praise words.
export function useSuccessFeedback(): () => void {
  const chime = useAudioPlayer(require('../../assets/audio/chime.wav'));
  return useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      chime.seekTo(0);
      chime.play();
    } catch (error) {
      console.warn('Could not play sound', error);
    }
  }, [chime]);
}
