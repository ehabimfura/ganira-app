import type { AudioSource } from 'expo-audio';

// Unit 1, "Taking a moto in Kigali": eight levels on a path, the way Duolingo lays out
// a unit (see docs/LESSON-DESIGN.md). Lessons teach a few phrases each, practice levels
// mix earlier phrases again (spaced review), and the unit ends with the full ride.
// The ids must match api/src/lessons/catalog.ts.
//
// Inside a lesson, new phrases are met inside exercises ("learn by doing"): a phrase is
// introduced (hear it, say it), then used straight away in varied exercises. Any
// exercise answered wrongly comes back once at the end of the lesson.
//
// Every clip is approved by a native speaker. Learner lines are in voice B; the motari's
// are voice-B takes lowered to a man's voice. A line without a clip shows as text only.

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

export type Exercise =
  // A new phrase: hear it, then say it.
  | { kind: 'introduce'; line: Line }
  // Hear Kinyarwanda, pick the English meaning.
  | { kind: 'listen'; line: Line; wrong: string[]; speaker?: 'motari' }
  // See the English, pick the Kinyarwanda.
  | { kind: 'read'; line: Line; wrong: Line[] }
  // Match each Kinyarwanda phrase with its meaning.
  | { kind: 'pairs'; lines: Line[] }
  // Hear a phrase and put its words in order; `extra` are decoy words.
  | { kind: 'build'; line: Line; extra: string[] }
  // Only the English shows: say the Kinyarwanda from memory.
  | { kind: 'recall'; line: Line }
  // A short exchange with the motari.
  | { kind: 'talk'; turns: Turn[] };

export type LevelKind = 'lesson' | 'practice' | 'roleplay';

export type Level =
  | { id: string; title: string; goal: string; kind: 'lesson' | 'practice'; exercises: Exercise[] }
  | { id: string; title: string; goal: string; kind: 'roleplay'; intro: string; turns: Turn[] };

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
  motariMurahoNeza: require('../../assets/audio/motari_muraho_neza.wav'),
  motariNdahazi: require('../../assets/audio/motari_ndahazi.wav'),
  motariMwaramutse: require('../../assets/audio/motari_mwaramutse.wav'),
  motariMwiriwe: require('../../assets/audio/motari_mwiriwe.wav'),
  motariBiteSe: require('../../assets/audio/motari_bite_se.wav'),
  motariIgihumbi: require('../../assets/audio/motari_igihumbi.wav'),
  motariTugende: require('../../assets/audio/motari_tugende.wav'),
  partSitadi: require('../../assets/audio/part_sitadi.wav'),
  partKuriSitadi: require('../../assets/audio/part_kuri_sitadi.wav'),
  partIRemeraKuriSitadi: require('../../assets/audio/part_i_remera_kuri_sitadi.wav'),
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
const part = {
  sitadi: { text: 'Sitadi', meaning: 'stadium', audio: audio.partSitadi },
  kuriSitadi: { text: 'kuri Sitadi', meaning: 'to the stadium', audio: audio.partKuriSitadi },
  iRemeraKuriSitadi: {
    text: 'i Remera kuri Sitadi',
    meaning: 'to Remera, to the stadium',
    audio: audio.partIRemeraKuriSitadi,
  },
  niAngahe: { text: 'ni angahe?', meaning: 'how much is it?', audio: audio.partNiAngahe },
  maganaInani: { text: 'magana inani', meaning: 'eight hundred', audio: audio.partMaganaInani },
  ndaguhaMaganaInani: {
    text: 'ndaguha magana inani',
    meaning: "I'll give you eight hundred",
    audio: audio.partNdaguhaMaganaInani,
  },
} satisfies Record<string, Line>;

// The motari's voice: approved voice-B takes lowered to a man's voice (tools/voice/deepen.py, m1).
const motari = {
  muraho: { text: 'Muraho neza', meaning: 'Hello to you too', audio: audio.motariMurahoNeza },
  mwaramutse: { text: 'Mwaramutse', meaning: 'Good morning', audio: audio.motariMwaramutse },
  mwiriwe: { text: 'Mwiriwe', meaning: 'Good afternoon / evening', audio: audio.motariMwiriwe },
  biteSe: { text: 'Bite se', meaning: "Hi, how's it going?", audio: audio.motariBiteSe },
  // Said with a long a, "ndahaazi", as people speak it.
  knowIt: { text: 'Yego, ndahazi.', meaning: 'Yes, I know the place.', audio: audio.motariNdahazi },
  price: { text: 'Ni igihumbi.', meaning: "It's 1000 francs.", audio: audio.motariIgihumbi },
  letsGo: { text: 'Ntacyo, vayo tugende.', meaning: "Okay, come, let's go.", audio: audio.motariTugende },
} satisfies Record<string, Line>;

const introduce = (line: Line): Exercise => ({ kind: 'introduce', line });
const listen = (line: Line, ...wrong: string[]): Exercise => ({ kind: 'listen', line, wrong });
const hearMotari = (line: Line, ...wrong: string[]): Exercise => ({ kind: 'listen', line, wrong, speaker: 'motari' });
const read = (line: Line, ...wrong: Line[]): Exercise => ({ kind: 'read', line, wrong });
const pairs = (...lines: Line[]): Exercise => ({ kind: 'pairs', lines });
const build = (line: Line, ...extra: string[]): Exercise => ({ kind: 'build', line, extra });
const recall = (line: Line): Exercise => ({ kind: 'recall', line });
const talk = (...turns: Turn[]): Exercise => ({ kind: 'talk', turns });
const say = (line: Line): Turn => ({ speaker: 'me', line });
const hears = (line: Line): Turn => ({ speaker: 'motari', line });

export const UNIT_NUMBER = 1;
export const UNIT_TITLE = 'Taking a moto in Kigali';
export const UNIT_GOAL = 'Greet a motari, say where you are going and agree on a price.';

export const LEVELS: Level[] = [
  {
    id: 'u1-hello',
    title: 'Hello',
    goal: 'Greet anyone at any time of day.',
    kind: 'lesson',
    exercises: [
      introduce(me.muraho),
      listen(me.muraho, 'Thank you', 'Good morning'),
      introduce(me.mwaramutse),
      read(me.mwaramutse, me.muraho),
      introduce(me.mwiriwe),
      hearMotari(motari.mwaramutse, 'Good afternoon / evening', 'Hello'),
      read(me.mwiriwe, me.mwaramutse, me.muraho),
      pairs(me.muraho, me.mwaramutse, me.mwiriwe),
      recall(me.muraho),
      recall(me.mwiriwe),
      recall(me.mwaramutse),
    ],
  },
  {
    id: 'u1-thanks',
    title: 'Hi and thanks',
    goal: 'Say hi to a friend, answer yes or no, and say thank you.',
    kind: 'lesson',
    exercises: [
      introduce(me.biteSe),
      hearMotari(motari.biteSe, 'Thank you', 'Good morning'),
      introduce(me.murakoze),
      read(me.murakoze, me.muraho, me.mwiriwe),
      introduce(me.yego),
      introduce(me.oya),
      listen(me.oya, 'Yes', 'Thank you'),
      read(me.yego, me.oya, me.biteSe),
      pairs(me.yego, me.oya, me.murakoze, me.biteSe),
      recall(me.murakoze),
      recall(me.oya),
      recall(me.mwiriwe),
    ],
  },
  {
    id: 'u1-practice-1',
    title: 'Practice: greetings',
    goal: 'Remember every greeting from the first two lessons.',
    kind: 'practice',
    exercises: [
      listen(me.mwiriwe, 'Good morning', 'Hello'),
      read(me.biteSe, me.murakoze, me.muraho),
      pairs(me.muraho, me.mwaramutse, me.mwiriwe, me.murakoze),
      hearMotari(motari.mwiriwe, 'Good morning', 'Thank you'),
      read(me.oya, me.yego, me.mota),
      recall(me.mwaramutse),
      recall(me.yego),
      recall(me.biteSe),
      recall(me.murakoze),
    ],
  },
  {
    id: 'u1-moto',
    title: 'Calling a moto',
    goal: 'Call a motari and greet him.',
    kind: 'lesson',
    exercises: [
      introduce(me.mota),
      read(me.mota, me.murakoze, me.oya),
      hearMotari(motari.muraho, 'Thank you', "Okay, come, let's go."),
      hearMotari(motari.letsGo, 'No, thank you.', 'Hello to you too'),
      pairs(me.mota, me.muraho, me.yego, me.murakoze),
      recall(me.mota),
      recall(me.muraho),
      talk(say(me.mwaramutse), hears(motari.mwaramutse), say(me.mota)),
    ],
  },
  {
    id: 'u1-where',
    title: 'Where to?',
    goal: 'Tell a motari where you want to go.',
    kind: 'lesson',
    exercises: [
      introduce(part.sitadi),
      introduce(part.kuriSitadi),
      introduce(part.iRemeraKuriSitadi),
      introduce(me.whereTo),
      build(me.whereTo, 'Mota', 'Oya'),
      hearMotari(motari.knowIt, "No, I don't know it.", "It's 1000 francs."),
      listen(me.whereTo, 'How much to Remera stadium?', 'Yes, I know the place.'),
      recall(me.whereTo),
      talk(say(me.mota), say(me.whereTo), hears(motari.knowIt)),
    ],
  },
  {
    id: 'u1-price',
    title: 'How much?',
    goal: 'Ask the price and offer less.',
    kind: 'lesson',
    exercises: [
      introduce(part.niAngahe),
      introduce(me.howMuch),
      build(me.howMuch, 'kujya', 'Yego'),
      hearMotari(motari.price, "It's 800 francs.", 'Yes, I know the place.'),
      introduce(part.maganaInani),
      introduce(part.ndaguhaMaganaInani),
      introduce(me.offer),
      build(me.offer, 'Yego', 'igihumbi'),
      recall(me.howMuch),
      recall(me.offer),
      talk(say(me.howMuch), hears(motari.price), say(me.offer), hears(motari.letsGo)),
    ],
  },
  {
    id: 'u1-practice-2',
    title: 'Practice: the ride',
    goal: 'Get every line of the ride ready.',
    kind: 'practice',
    exercises: [
      hearMotari(motari.knowIt, "It's 1000 francs.", "Okay, come, let's go."),
      read(me.whereTo, me.howMuch, me.offer),
      hearMotari(motari.price, "It's 800 francs.", 'Hello to you too'),
      build(me.offer, 'Mota', 'kuri'),
      pairs(me.mota, me.murakoze, me.oya, me.mwiriwe),
      hearMotari(motari.letsGo, 'No, thank you.', "It's 1000 francs."),
      recall(me.whereTo),
      recall(me.howMuch),
      recall(me.offer),
    ],
  },
  {
    id: 'u1-ride',
    title: 'The ride',
    goal: 'Take a moto to Remera stadium and agree on a price, all in Kinyarwanda.',
    kind: 'roleplay',
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

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

// A level opens once the one before it is finished.
export function isUnlocked(index: number, completed: readonly string[]): boolean {
  return index === 0 || completed.includes(LEVELS[index - 1].id);
}

// Every phrase in the unit, for the daily review: the API names due phrases by their
// Kinyarwanda text, and the review builds its exercises from these lines.
const LEARNER_LINES: Line[] = [...Object.values(me), ...Object.values(part)];
const MOTARI_LINES: Line[] = Object.values(motari);

export function findReviewLine(text: string): { line: Line; motari: boolean } | undefined {
  const mine = LEARNER_LINES.find((l) => l.text === text);
  if (mine) return { line: mine, motari: false };
  const theirs = MOTARI_LINES.find((l) => l.text === text);
  return theirs ? { line: theirs, motari: true } : undefined;
}

// Two other phrases to offer as wrong answers, chosen by a fixed rule so a review looks
// the same each time for the same phrases.
function othersThan(line: Line, pool: Line[]): Line[] {
  const rest = pool.filter((l) => l.meaning !== line.meaning);
  const start = line.text.length % rest.length;
  const picked: Line[] = [];
  for (let i = 0; i < rest.length && picked.length < 2; i++) {
    const candidate = rest[(start + i * 3) % rest.length];
    if (!picked.some((p) => p.meaning === candidate.meaning)) picked.push(candidate);
  }
  return picked;
}

// The daily review: one exercise per due phrase, weakest first, mixing listening,
// reading and saying it from memory. The motari's lines are always listening.
export function reviewExercises(phrases: string[]): Exercise[] {
  return phrases.flatMap((text, i): Exercise[] => {
    const found = findReviewLine(text);
    if (!found) return [];
    const { line } = found;
    if (found.motari) return [hearMotari(line, ...othersThan(line, MOTARI_LINES).map((l) => l.meaning))];
    const kind = i % 3;
    if (kind === 0) return [listen(line, ...othersThan(line, LEARNER_LINES).map((l) => l.meaning))];
    if (kind === 1) return [read(line, ...othersThan(line, LEARNER_LINES))];
    return [recall(line)];
  });
}
