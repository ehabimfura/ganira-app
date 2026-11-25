import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { Speak } from '@/components/speak';
import { Button } from '@/components/ui';
import type { Cue, Pause, VideoClip } from '@/content/unit1';
import { colors, font, fonts, icon, radiusLarge, shadow, space } from '@/theme';

// How often the player reports its time. Fine enough to stop within a fraction of a second.
const TIME_STEP_SECONDS = 0.1;
// Within this many seconds of the end, the clip counts as finished.
const END_MARGIN_SECONDS = 0.15;

// A video with captions. It plays, and stops at each pause so the learner can say the phrase.
// Captions show Kinyarwanda and English together, as Speak does. Nothing is scored here
// except the spoken repeats, which go through the speech check.
export function WatchExercise({
  clip,
  cues,
  pauses,
  onDone,
  onProgress,
}: {
  clip: VideoClip;
  cues: Cue[];
  pauses: Pause[];
  onDone: () => void;
  // How far through the video (0 to 1), so the lesson bar follows the video.
  onProgress: (fraction: number) => void;
}) {
  const player = useVideoPlayer(clip, (p) => {
    p.timeUpdateEventInterval = TIME_STEP_SECONDS;
    p.play();
  });
  const [time, setTime] = useState(0);
  // Which pause the video has stopped at, or null while it plays.
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  // Whether the learner has tried the phrase at the current pause.
  const [spoke, setSpoke] = useState(false);
  // Counts replays, so the speech check starts fresh after each one.
  const [replays, setReplays] = useState(0);
  // Refs keep the event handler current without re-subscribing on every tick.
  const nextPause = useRef(0);
  const stopped = useRef(false);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (stopped.current) return;
    setTime(currentTime);
    if (player.duration > 0) onProgress(Math.min(1, currentTime / player.duration));
    const pause = pauses[nextPause.current];
    if (pause && currentTime >= pause.at) {
      stopped.current = true;
      player.pause();
      setTime(pause.at);
      setPausedAt(nextPause.current);
      return;
    }
    if (!pause && player.duration > 0 && currentTime >= player.duration - END_MARGIN_SECONDS) {
      stopped.current = true;
      onProgress(1);
      setEnded(true);
    }
  });

  // The learner has said the phrase: carry on from the pause.
  // Rewinds to the start of the sentence the learner is repeating, and plays it again to the pause.
  const replay = () => {
    const from = pauses[pausedAt ?? 0].from;
    stopped.current = false;
    player.seekBy(from - player.currentTime);
    setTime(from);
    setSpoke(false);
    setPausedAt(null);
    setReplays((n) => n + 1);
    player.play();
  };

  const resume = () => {
    nextPause.current += 1;
    stopped.current = false;
    setPausedAt(null);
    setSpoke(false);
    player.play();
  };

  const cue = cues.find((c) => time >= c.start && time < c.end);
  const pause = pausedAt === null ? undefined : pauses[pausedAt];

  return (
    <View style={styles.flex}>
      <View style={styles.videoFrame}>
        <VideoView player={player} style={styles.video} contentFit="contain" nativeControls={false} />
        {pausedAt !== null && (
          <View style={styles.replayWrap} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hear this sentence again"
              onPress={replay}
              style={styles.replay}
            >
              <RotateCcw size={icon.size} color="#FFFFFF" strokeWidth={icon.stroke} />
            </Pressable>
          </View>
        )}
      </View>

      {pause ? (
        <View style={styles.flex}>
          <View style={styles.card}>
            <Text style={styles.phrase}>{pause.line.text}</Text>
            <Text style={styles.meaning}>{pause.line.meaning}</Text>
          </View>
          <Text style={styles.hint}>Say it out loud</Text>
          {/* Keyed by pause so each repeat starts fresh. */}
          <Speak key={`${pausedAt}-${replays}`} expected={pause.line.text} assumeHeard={pause.assumeHeard} onTried={() => setSpoke(true)} />
          {spoke && <Button label="Continue" variant="success" onPress={resume} />}
        </View>
      ) : ended ? (
        <View style={styles.flex}>
          <View style={styles.captions}>
            <Text style={styles.kinyarwanda}>{cues[cues.length - 1]?.kinyarwanda}</Text>
            <Text style={styles.english}>{cues[cues.length - 1]?.english}</Text>
          </View>
          <Button label="Continue" variant="success" onPress={onDone} />
        </View>
      ) : (
        <View style={styles.captions}>
          <Text style={styles.kinyarwanda}>{cue?.kinyarwanda ?? ' '}</Text>
          <Text style={styles.english}>{cue?.english ?? ' '}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  videoFrame: { borderRadius: radiusLarge, overflow: 'hidden', backgroundColor: colors.text, ...shadow },
  video: { width: '100%', aspectRatio: 16 / 9 },
  replayWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  replay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  captions: { minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingHorizontal: space.sm },
  kinyarwanda: { fontSize: font.body + 6, fontFamily: fonts.heading, color: colors.text, textAlign: 'center' },
  english: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },
  card: {
    alignItems: 'center',
    gap: space.xs,
    padding: space.lg,
    borderRadius: radiusLarge,
    backgroundColor: colors.surface,
    ...shadow,
  },
  phrase: { fontSize: font.title, fontFamily: fonts.heading, color: colors.text, textAlign: 'center' },
  meaning: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },
  hint: { fontSize: font.body, fontFamily: fonts.semibold, color: colors.muted, textAlign: 'center' },
});
