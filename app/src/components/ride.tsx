import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Speak } from '@/components/speak';
import { Body, Button, Choice } from '@/components/ui';
import type { GreetingOption, Line, Turn } from '@/content/module1';
import { useClipPlayer } from '@/lib/sounds';
import { colors, font, fonts, radiusLarge, shadow, space } from '@/theme';

// A conversation with a motari, as a chat: the full ride in lesson 5, and short
// exchanges at the end of lessons 2-4. The learner speaks their lines; each motari
// answer appears (and plays) as soon as the learner moves on.
export function Ride({
  intro,
  turns,
  onFinish,
  finishLabel = '🏍️ Finish',
}: {
  intro?: string;
  turns: Turn[];
  onFinish: () => void;
  finishLabel?: string;
}) {
  const play = useClipPlayer();
  const scroll = useRef<ScrollViewInstance>(null);
  const [position, setPosition] = useState(0);
  const [greeting, setGreeting] = useState<GreetingOption | null>(null);

  const lineOf = (turn: Turn, chosen: GreetingOption | null): Line | null => {
    if ('line' in turn) return turn.line;
    if ('choose' in turn) return chosen?.line ?? null;
    return chosen?.reply ?? null;
  };

  // Moves past the learner's turn, then shows and plays the motari's answer, if any.
  const advance = (chosen: GreetingOption | null) => {
    let next = position + 1;
    let answer: Line | null = null;
    while (next < turns.length && turns[next].speaker === 'motari') {
      answer = lineOf(turns[next], chosen);
      next += 1;
    }
    if (answer?.audio) play(answer.audio);
    setPosition(next);
  };

  const current = turns[position];
  const finished = position >= turns.length;

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.chat}
        // Keep the newest line in view, also when the panel below shrinks and the chat grows.
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        onLayout={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {intro ? <Body>{intro}</Body> : null}
        {turns.slice(0, position).map((turn, i) => {
          const line = lineOf(turn, greeting);
          return line ? <Bubble key={i} line={line} mine={turn.speaker === 'me'} onPlay={play} /> : null;
        })}
      </ScrollView>

      {finished ? (
        <Button label={finishLabel} onPress={onFinish} />
      ) : 'choose' in current ? (
        <GreetingTurn
          options={current.choose}
          onPlay={play}
          onDone={(option) => {
            setGreeting(option);
            advance(option);
          }}
        />
      ) : (
        <SayTurn key={position} line={lineOf(current, greeting)!} onPlay={play} onDone={() => advance(greeting)} />
      )}
    </View>
  );
}

function Bubble({ line, mine, onPlay }: { line: Line; mine: boolean; onPlay: (clip: Line['audio']) => void }) {
  return (
    <Pressable
      accessibilityRole={line.audio ? 'button' : 'text'}
      accessibilityLabel={`${mine ? 'You' : 'Motari'}: ${line.text}`}
      disabled={!line.audio}
      onPress={() => onPlay(line.audio)}
      style={[styles.bubble, mine ? styles.mine : styles.theirs]}
    >
      {!mine && <Text style={styles.who}>🏍️ Motari</Text>}
      <Text style={[styles.bubbleText, mine && styles.mineText]}>{line.text}</Text>
      <Text style={[styles.bubbleMeaning, mine && styles.mineText]}>{line.meaning}</Text>
    </Pressable>
  );
}

// The learner's next line: hear it, say it (the speech check shows the heard words), then move on.
function SayTurn({ line, onPlay, onDone }: { line: Line; onPlay: (clip: Line['audio']) => void; onDone: () => void }) {
  const [heard, setHeard] = useState(!line.audio);
  const [spoke, setSpoke] = useState(false);
  return (
    <View style={styles.turn}>
      <Text style={styles.yourTurn}>Your turn</Text>
      <Text style={styles.phrase}>{line.text}</Text>
      <Text style={styles.meaning}>{line.meaning}</Text>
      {line.audio ? (
        <Button
          label="🔊 Listen"
          variant="secondary"
          onPress={() => {
            onPlay(line.audio);
            setHeard(true);
          }}
        />
      ) : null}
      {heard && <Speak expected={line.text} onTried={() => setSpoke(true)} />}
      {spoke && <Button label="Next" onPress={onDone} />}
    </View>
  );
}

// The opening: the learner picks the greeting that fits the time of day.
function GreetingTurn({
  options,
  onPlay,
  onDone,
}: {
  options: GreetingOption[];
  onPlay: (clip: Line['audio']) => void;
  onDone: (option: GreetingOption) => void;
}) {
  const [picked, setPicked] = useState<GreetingOption | null>(null);
  const [spoke, setSpoke] = useState(false);
  return (
    <View style={styles.turn}>
      <Text style={styles.yourTurn}>Your turn: greet the motari</Text>
      {options.map((option) => (
        <Choice
          key={option.line.text}
          label={option.line.text}
          hint={option.line.meaning}
          selected={picked === option}
          onPress={() => {
            setPicked(option);
            setSpoke(false);
            onPlay(option.line.audio);
          }}
        />
      ))}
      {picked && <Speak key={picked.line.text} expected={picked.line.text} onTried={() => setSpoke(true)} />}
      {picked && spoke && <Button label="Next" onPress={() => onDone(picked)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chat: { gap: space.sm, paddingBottom: space.md },
  bubble: { maxWidth: '80%', padding: space.md, borderRadius: radiusLarge, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, ...shadow },
  who: { fontSize: font.label, color: colors.muted, fontFamily: fonts.semibold },
  bubbleText: { fontSize: font.body, fontFamily: fonts.bold, color: colors.text },
  bubbleMeaning: { fontSize: font.label, fontFamily: fonts.regular, color: colors.muted },
  mineText: { color: colors.primaryText },
  turn: { gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderColor: colors.border },
  yourTurn: { fontSize: font.label, color: colors.primary, fontFamily: fonts.bold },
  phrase: { fontSize: font.body + 4, fontFamily: fonts.bold, color: colors.text },
  meaning: { fontSize: font.label, fontFamily: fonts.regular, color: colors.muted },
});
