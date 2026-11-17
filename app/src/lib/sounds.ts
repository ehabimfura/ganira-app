import { useAudioPlayer, type AudioSource } from 'expo-audio';
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

// A missing speaker or a browser that blocks sound must never stop a lesson,
// so failures are logged and the lesson carries on.

// One player for all the lesson clips: play(clip) stops whatever was playing.
// A line with no recording yet (clip undefined) plays nothing.
export function useClipPlayer(): (clip: AudioSource | undefined) => void {
  const player = useAudioPlayer(null);
  return useCallback(
    (clip: AudioSource | undefined) => {
      if (!clip) return;
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

// A short sound from the lesson's own clip files, played from the start each time.
function useOneShot(clip: AudioSource): () => void {
  const player = useAudioPlayer(clip);
  return useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.warn('Could not play sound', error);
    }
  }, [player]);
}

function useChime(): () => void {
  return useOneShot(require('../../assets/audio/chime.wav'));
}

// Feedback is a sound and a vibration, never praise words.
export function useSuccessFeedback(): () => void {
  const chime = useChime();
  return useCallback(() => {
    haptics.correct();
    chime();
  }, [chime]);
}

// A wrong answer: a soft falling tone and the wrong-answer buzz.
export function useWrongFeedback(): () => void {
  const wrongTone = useOneShot(require('../../assets/audio/wrong.wav'));
  return useCallback(() => {
    haptics.wrong();
    wrongTone();
  }, [wrongTone]);
}

// A finished lesson: the chime with the long celebration vibration.
export function useCelebration(): () => void {
  const chime = useChime();
  return useCallback(() => {
    haptics.celebrate();
    chime();
  }, [chime]);
}
