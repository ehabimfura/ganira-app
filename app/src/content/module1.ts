import type { AudioSource } from 'expo-audio';

// Module 1, "Taking a moto in Kigali". Lessons 1-4 each teach one step of the ride;
// lesson 5 is the ride itself. The ids must match api/src/lessons/catalog.ts.
//
// Learner lines are in voice B, each clip approved by a native speaker.
// The motari's lines are recorded by a native speaker (tools/voice/module1-motari.txt);
// until a recording is added, that line shows as text with no sound.

export interface Line {
  text: string;
  meaning: string;
  audio?: AudioSource;
}

// "say": the learner hears the line, then says it. "hear": the motari's words, to understand.
export type Step = { kind: 'say'; line: Line } | { kind: 'hear'; line: Line };

// A turn in the ride. In a "choose" turn the learner picks a greeting, and the
// "greetingReply" turn is the motari answering with that same greeting.
export interface GreetingOption {
  line: Line;
  reply: Line;
}
export type Turn =
  | { speaker: 'me'; line: Line }
  | { speaker: 'motari'; line: Line }
  | { speaker: 'me'; choose: GreetingOption[] }
  | { speaker: 'motari'; greetingReply: true };

export type Lesson =
  | { id: string; title: string; kind: 'steps'; steps: Step[] }
  | { id: string; title: string; kind: 'ride'; intro: string; turns: Turn[] };

const audio = {
  muraho: require('../../assets/audio/muraho.wav'),
  mwaramutse: require('../../assets/audio/mwaramutse.wav'),
  mwiriwe: require('../../assets/audio/mwiriwe.wav'),
  biteSe: require('../../assets/audio/bite_se.wav'),
  mota: require('../../assets/audio/mota.wav'),
  yego: require('../../assets/audio/yego.wav'),
  oya: require('../../assets/audio/oya.wav'),
  murakoze: require('../../assets/audio/murakoze.wav'),
  ndashakaKujya: require('../../assets/audio/ndashaka_kujya.wav'),
  niAngahe: require('../../assets/audio/ni_angahe.wav'),
  ndaguha: require('../../assets/audio/ndaguha.wav'),
};

const me = {
  muraho: { text: 'Muraho', meaning: 'Hello', audio: audio.muraho },
  mwaramutse: { text: 'Mwaramutse', meaning: 'Good morning', audio: audio.mwaramutse },
  mwiriwe: { text: 'Mwiriwe', meaning: 'Good afternoon / evening', audio: audio.mwiriwe },
  biteSe: { text: 'Bite se', meaning: "Hi, how's it going? (casual)", audio: audio.biteSe },
  mota: { text: 'Mota?', meaning: 'Moto? (calling a moto driver)', audio: audio.mota },
  yego: { text: 'Yego', meaning: 'Yes', audio: audio.yego },
  oya: { text: 'Oya', meaning: 'No', audio: audio.oya },
  murakoze: { text: 'Murakoze', meaning: 'Thank you', audio: audio.murakoze },
  whereTo: {
    text: 'Ndashaka kujya i Remera kuri Stade.',
    meaning: 'I want to go to Remera, to the stadium.',
    audio: audio.ndashakaKujya,
  },
  howMuch: { text: 'I Remera kuri Stade ni angahe?', meaning: 'How much to Remera stadium?', audio: audio.niAngahe },
  offer: { text: 'Oya, ndaguha magana inani.', meaning: "No, I'll give you 800 francs.", audio: audio.ndaguha },
} satisfies Record<string, Line>;

const motari = {
  muraho: { text: 'Muraho', meaning: 'Hello' },
  mwaramutse: { text: 'Mwaramutse', meaning: 'Good morning' },
  mwiriwe: { text: 'Mwiriwe', meaning: 'Good afternoon / evening' },
  biteSe: { text: 'Bite se', meaning: "Hi, how's it going?" },
  knowIt: { text: 'Yego, ndahazi.', meaning: 'Yes, I know the place.' },
  price: { text: 'Ni igihumbi.', meaning: "It's 1000 francs." },
  letsGo: { text: 'Ntacyo, vayo tugende.', meaning: "Okay, come, let's go." },
} satisfies Record<string, Line>;

const say = (line: Line): Step => ({ kind: 'say', line });
const hear = (line: Line): Step => ({ kind: 'hear', line });

export const MODULE_TITLE = 'Taking a moto in Kigali';

export const LESSONS: Lesson[] = [
  {
    id: 'moto-1',
    title: 'Greetings',
    kind: 'steps',
    steps: [say(me.muraho), say(me.mwaramutse), say(me.mwiriwe), say(me.biteSe), say(me.mota)],
  },
  {
    id: 'moto-2',
    title: 'Yes and no',
    kind: 'steps',
    steps: [say(me.yego), say(me.oya), say(me.murakoze), hear(motari.letsGo)],
  },
  {
    id: 'moto-3',
    title: 'Where to?',
    kind: 'steps',
    steps: [say(me.whereTo), hear(motari.knowIt)],
  },
  {
    id: 'moto-4',
    title: 'How much?',
    kind: 'steps',
    steps: [say(me.howMuch), hear(motari.price), say(me.offer)],
  },
  {
    id: 'moto-5',
    title: 'The ride',
    kind: 'ride',
    intro: 'You need a moto to Remera stadium. Greet the motari and agree on a price.',
    turns: [
      {
        speaker: 'me',
        choose: [
          { line: me.muraho, reply: motari.muraho },
          { line: me.mwaramutse, reply: motari.mwaramutse },
          { line: me.mwiriwe, reply: motari.mwiriwe },
          { line: me.biteSe, reply: motari.biteSe },
        ],
      },
      { speaker: 'me', line: me.mota },
      { speaker: 'motari', greetingReply: true },
      { speaker: 'me', line: me.whereTo },
      { speaker: 'motari', line: motari.knowIt },
      { speaker: 'me', line: me.howMuch },
      { speaker: 'motari', line: motari.price },
      { speaker: 'me', line: me.offer },
      { speaker: 'motari', line: motari.letsGo },
    ],
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

// A lesson opens once the one before it is finished.
export function isUnlocked(index: number, completed: readonly string[]): boolean {
  return index === 0 || completed.includes(LESSONS[index - 1].id);
}
