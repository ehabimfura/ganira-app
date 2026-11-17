import { RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BuildExercise } from '@/components/lesson/build-exercise';
import { ListenExercise, ReadExercise } from '@/components/lesson/choice-exercise';
import { LessonHeader } from '@/components/lesson/lesson-header';
import { PairsExercise } from '@/components/lesson/pairs-exercise';
import { IntroduceExercise, RecallExercise } from '@/components/lesson/speak-exercise';
import { Ride } from '@/components/ride';
import type { Exercise } from '@/content/unit1';
import type { PracticeResult } from '@/lib/practice';
import { colors, font, fonts, icon, palette, space } from '@/theme';

type Item = { exercise: Exercise; retry: boolean };

// The phrases an exercise tested, with how it went, for the spaced review.
// A new phrase counts as a first success; a talk with the motari tests nothing new.
function resultsOf(exercise: Exercise, correct: boolean): PracticeResult[] {
  switch (exercise.kind) {
    case 'introduce':
      return [{ phrase: exercise.line.text, correct: true }];
    case 'pairs':
      return exercise.lines.map((line) => ({ phrase: line.text, correct }));
    case 'talk':
      return [];
    default:
      return [{ phrase: exercise.line.text, correct }];
  }
}

// Runs a lesson's exercises one after another. An exercise answered wrongly comes back
// once at the end, marked "Previous mistake", as Duolingo does. Only first answers count
// toward the spaced review.
export function LessonRunner({
  exercises,
  onFinish,
  onQuit,
}: {
  exercises: Exercise[];
  onFinish: (results: PracticeResult[]) => void;
  onQuit: () => void;
}) {
  const [queue, setQueue] = useState<Item[]>(() => exercises.map((exercise) => ({ exercise, retry: false })));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  // How far through the current exercise (0 to 1): a conversation fills it turn by turn.
  const [within, setWithin] = useState(0);
  const item = queue[index];

  const done = (correct = true) => {
    const answered = item.retry ? results : [...results, ...resultsOf(item.exercise, correct)];
    setResults(answered);
    const next = !correct && !item.retry ? [...queue, { exercise: item.exercise, retry: true }] : queue;
    if (index + 1 >= next.length) {
      onFinish(answered);
      return;
    }
    setQueue(next);
    setWithin(0);
    setIndex(index + 1);
  };

  return (
    <View style={styles.flex}>
      <LessonHeader progress={(index + within) / queue.length} onQuit={onQuit} />
      {item.retry && (
        <View style={styles.retry}>
          <RotateCcw size={16} color={palette.orange} strokeWidth={icon.stroke} />
          <Text style={styles.retryText}>Previous mistake</Text>
        </View>
      )}
      {/* The key gives every exercise a fresh start, also when one comes back. */}
      <ExerciseView key={index} exercise={item.exercise} onDone={done} onProgress={setWithin} />
    </View>
  );
}

function ExerciseView({
  exercise,
  onDone,
  onProgress,
}: {
  exercise: Exercise;
  onDone: (correct?: boolean) => void;
  onProgress: (fraction: number) => void;
}) {
  switch (exercise.kind) {
    case 'introduce':
      return <IntroduceExercise line={exercise.line} onDone={() => onDone()} />;
    case 'listen':
      return <ListenExercise line={exercise.line} wrong={exercise.wrong} speaker={exercise.speaker} onDone={onDone} />;
    case 'read':
      return <ReadExercise line={exercise.line} wrong={exercise.wrong} onDone={onDone} />;
    case 'pairs':
      return <PairsExercise lines={exercise.lines} onDone={onDone} />;
    case 'build':
      return <BuildExercise line={exercise.line} extra={exercise.extra} onDone={onDone} />;
    case 'recall':
      return <RecallExercise line={exercise.line} onDone={onDone} />;
    case 'talk':
      return (
        <View style={styles.flex}>
          <Text style={styles.talk}>Now try it with the motari</Text>
          <Ride turns={exercise.turns} onFinish={() => onDone()} onProgress={onProgress} finishLabel="Continue" />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.md },
  retry: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  retryText: { fontSize: font.label, fontFamily: fonts.bold, color: palette.orange, textTransform: 'uppercase', letterSpacing: 0.6 },
  talk: { fontSize: font.body + 4, fontFamily: fonts.heading, color: colors.text },
});
