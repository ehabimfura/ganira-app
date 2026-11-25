import * as adventurer from '@dicebear/adventurer';
import { createAvatar } from '@dicebear/core';
import { palette } from '@/theme';
import { catSvg, dogSvg } from '@/lib/pets';
import { riderSvg } from '@/lib/rider';

// The motari's picture in conversations. It is not one of the learner's choices.
export const MOTARI_ID = 'motari';

// People are drawn by DiceBear's "Adventurer" style (art by Lisa Wischofsky, CC BY 4.0, credited
// on the Credits screen). The id stored in the database is the seed, so the same id always draws
// the same face. Most faces get Rwandan skin tones. Pets are drawn in lib/pets.ts.
const DARK = '763900';
const BROWN = '9e5622';

const HAIR_COLORS = ['2c1b18', '4a312c', '6a4e42', '1b1b1b'];

// Hair styles from DiceBear's Adventurer style, split by length. Written out so the types match.
const SHORT_HAIR = [
  'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08',
  'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15', 'short16',
] as const;
const LONG_HAIR = [
  'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10',
  'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20',
] as const;

// Each look sets only what tells the figures apart: hair length, earrings, mustache.
type HairName = (typeof SHORT_HAIR)[number] | (typeof LONG_HAIR)[number];
type Look = { hair: readonly HairName[]; earrings: number; mustache: number };
const BOY: Look = { hair: SHORT_HAIR, earrings: 0, mustache: 0 };
const GIRL: Look = { hair: LONG_HAIR, earrings: 100, mustache: 0 };
const MAN: Look = { hair: SHORT_HAIR, earrings: 0, mustache: 100 };

type Person = { kind: 'person'; look: Look; skin: string; background: string };
type Pet = { kind: 'cat' | 'dog'; background: string };

export const AVATARS = [
  { id: 'lion', kind: 'person', look: BOY, skin: DARK, background: palette.yellow },
  { id: 'gorilla', kind: 'person', look: BOY, skin: BROWN, background: palette.green },
  { id: 'giraffe', kind: 'person', look: GIRL, skin: BROWN, background: palette.cyan },
  { id: 'zebra', kind: 'person', look: GIRL, skin: DARK, background: palette.blue },
  { id: 'elephant', kind: 'person', look: MAN, skin: BROWN, background: palette.blue },
  { id: 'hippo', kind: 'person', look: MAN, skin: DARK, background: palette.green },
  { id: 'leopard', kind: 'cat', background: palette.cyan },
  { id: 'cow', kind: 'dog', background: palette.cyan },
] as const satisfies readonly ({ id: string } & (Person | Pet))[];

const cache = new Map<string, string>();

function drawPerson(id: string, person: Person): string {
  return createAvatar(adventurer, {
    seed: id,
    skinColor: [person.skin],
    backgroundColor: [person.background.slice(1).toLowerCase()],
    radius: 50,
    hair: [...person.look.hair],
    // Natural hair colours only, and no sunglasses: the picker should show people, not costumes.
    hairColor: HAIR_COLORS,
    glassesProbability: 0,
    earringsProbability: person.look.earrings,
    features: person.look.mustache ? ['mustache'] : [],
    featuresProbability: person.look.mustache,
  }).toString();
}

// The avatar as an SVG document, ready for react-native-svg's SvgXml.
export function avatarSvg(id: string): string {
  const cached = cache.get(id);
  if (cached) return cached;
  const avatar = AVATARS.find((a) => a.id === id);
  let svg: string;
  if (id === MOTARI_ID) {
    svg = riderSvg(palette.green.slice(1));
  } else if (!avatar) {
    // An id from before the list changed: draw a boy's face from the seed, so it still shows something.
    svg = drawPerson(id, { kind: 'person', look: BOY, skin: BROWN, background: palette.green });
  } else if (avatar.kind === 'cat') {
    svg = catSvg(avatar.background.slice(1));
  } else if (avatar.kind === 'dog') {
    svg = dogSvg(avatar.background.slice(1));
  } else {
    svg = drawPerson(id, avatar);
  }
  cache.set(id, svg);
  return svg;
}
