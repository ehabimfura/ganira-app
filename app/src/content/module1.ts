import type { AudioSource } from 'expo-audio';

// Module 1, "Taking a moto in Kigali". Lessons 1-4 each teach one step of the ride;
// lesson 5 is the ride itself. The ids must match api/src/lessons/catalog.ts.
//
// Every lesson follows the same research-based shape (see docs/LESSON-DESIGN.md):
//   goal   - what the learner will be able to do (a CEFR-style "can do")
//   learn  - at most 4 new things: hear it, say it. Long phrases are built backward from the end.
//   listen - the motari speaks; the learner picks what it means
//   recall - only the English shows; the learner says it from memory (retrieval practice),
//            including 1-2 phrases from earlier lessons (spaced review)
//   talk   - a short exchange with the motari using the lesson's phrases
//
// Learner lines are in voice B, each clip approved by a native speaker.
// The motari's lines are recorded by a native speaker (tools/voice/module1-motari.txt);
// until a recording is added, that line shows as text with no sound.

export interface Line {
  text: string;
  meaning: string;
  audio?: AudioSource;
}

// In a "choose" turn the learner picks a greeting, and the "greetingReply"
// turn is the motari answering with that same greeting.
export interface GreetingOption {
  line: Line;
  reply: Line;
}
export type Turn =
  | { speaker: 'me'; line: Line }
  | { speaker: 'motari'; line: Line }
  | { speaker: 'me'; choose: GreetingOption[] }
  | { speaker: 'motari'; greetingReply: true };

export type Step =
  | { kind: 'learn'; line: Line }
  | { kind: 'listen'; line: Line; wrongMeanings: string[] }
  | { kind: 'recall'; line: Line }
  | { kind: 'talk'; turns: Turn[] };

export type Lesson =
  | { id: string; title: string; goal: string; kind: 'steps'; steps: Step[] }
  | { id: string; title: string; goal: string; kind: 'ride'; intro: string; turns: Turn[] };

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
  partNiAngahe: require('../../assets/audio/part_ni_angahe.wav'),
  partMaganaInani: require('../../assets/audio/part_magana_inani.wav'),
  partNdaguhaMaganaInani: require('../../assets/audio/part_ndaguha_magana_inani.wav'),
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
    text: 'Ndashaka kujya i Remera kuri Sitadi.',
    meaning: 'I want to go to Remera, to the stadium.',
    audio: audio.ndashakaKujya,
  },
  howMuch: { text: 'I Remera kuri Sitadi ni angahe?', meaning: 'How much to Remera stadium?', audio: audio.niAngahe },
  offer: { text: 'Oya, ndaguha magana inani.', meaning: "No, I'll give you 800 francs.", audio: audio.ndaguha },
} satisfies Record<string, Line>;

// Backward build-up: the end of a long phrase first, so its natural melody is kept.
// "Stade" is written "Sitadi" in Kinyarwanda, which has no "st" cluster.
// The Sitadi clips are waiting for the native speaker's approval (tools/voice/module1-sitadi.txt).
const part = {
  sitadi: { text: 'Sitadi', meaning: 'stadium' },
  kuriSitadi: { text: 'kuri Sitadi', meaning: 'to the stadium' },
  iRemeraKuriSitadi: { text: 'i Remera kuri Sitadi', meaning: 'to Remera, to the stadium' },
  niAngahe: { text: 'ni angahe?', meaning: 'how much is it?', audio: audio.partNiAngahe },
  maganaInani: { text: 'magana inani', meaning: 'eight hundred', audio: audio.partMaganaInani },
  ndaguhaMaganaInani: {
    text: 'ndaguha magana inani',
    meaning: "I'll give you eight hundred",
    audio: audio.partNdaguhaMaganaInani,
  },
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

const learn = (line: Line): Step => ({ kind: 'learn', line });
const recall = (line: Line): Step => ({ kind: 'recall', line });
const listen = (line: Line, ...wrongMeanings: string[]): Step => ({ kind: 'listen', line, wrongMeanings });
const talk = (...turns: Turn[]): Step => ({ kind: 'talk', turns });
const say = (line: Line): Turn => ({ speaker: 'me', line });
const hears = (line: Line): Turn => ({ speaker: 'motari', line });

export const MODULE_TITLE = 'Taking a moto in Kigali';

export const LESSONS: Lesson[] = [
  {
    id: 'moto-1',
    title: 'Greetings',
    goal: 'Greet anyone at any time of day.',
    kind: 'steps',
    steps: [
      learn(me.muraho),
      learn(me.mwaramutse),
      learn(me.mwiriwe),
      learn(me.biteSe),
      listen(motari.mwaramutse, 'Thank you', 'Good afternoon / evening'),
      recall(me.muraho),
      recall(me.mwiriwe),
      recall(me.mwaramutse),
    ],
  },
  {
    id: 'moto-2',
    title: 'Calling a moto',
    goal: 'Call a motari and answer yes, no and thank you.',
    kind: 'steps',
    steps: [
      learn(me.mota),
      learn(me.yego),
      learn(me.oya),
      learn(me.murakoze),
      listen(motari.letsGo, 'No, thank you.', 'Yes, I know the place.'),
      recall(me.yego),
      recall(me.murakoze),
      recall(me.oya),
      recall(me.mwaramutse),
      talk(say(me.mota), hears(motari.letsGo), say(me.murakoze)),
    ],
  },
  {
    id: 'moto-3',
    title: 'Where to?',
    goal: 'Tell a motari where you want to go.',
    kind: 'steps',
    steps: [
      learn(part.sitadi),
      learn(part.kuriSitadi),
      learn(part.iRemeraKuriSitadi),
      learn(me.whereTo),
      listen(motari.knowIt, "No, I don't know it.", "It's 1000 francs."),
      recall(me.whereTo),
      recall(me.mota),
      recall(me.mwiriwe),
      talk(say(me.mota), say(me.whereTo), hears(motari.knowIt)),
    ],
  },
  {
    id: 'moto-4',
    title: 'How much?',
    goal: 'Ask the price and offer less.',
    kind: 'steps',
    steps: [
      learn(part.niAngahe),
      learn(me.howMuch),
      learn(part.maganaInani),
      learn(part.ndaguhaMaganaInani),
      learn(me.offer),
      listen(motari.price, "It's 800 francs.", 'Yes, I know the place.'),
      recall(me.howMuch),
      recall(me.offer),
      recall(me.whereTo),
      recall(me.yego),
      talk(say(me.howMuch), hears(motari.price), say(me.offer), hears(motari.letsGo)),
    ],
  },
  {
    id: 'moto-5',
    title: 'The ride',
    goal: 'Take a moto to Remera stadium and agree on a price, all in Kinyarwanda.',
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
      say(me.mota),
      { speaker: 'motari', greetingReply: true },
      say(me.whereTo),
      hears(motari.knowIt),
      say(me.howMuch),
      hears(motari.price),
      say(me.offer),
      hears(motari.letsGo),
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
