import * as adventurer from '@dicebear/adventurer';
import { createAvatar } from '@dicebear/core';
import { palette } from '@/theme';

// Profile pictures are drawn by DiceBear's "Adventurer" style (art by Lisa Wischofsky,
// CC BY 4.0, credited on the Credits screen). The id stored in the database is the seed,
// so the same id always draws the same face. Most faces get Rwandan skin tones.
const DARK = '763900';
const BROWN = '9e5622';
const LIGHT = 'ecad80';

export const AVATARS = [
  { id: 'lion', skin: DARK, background: palette.yellow },
  { id: 'giraffe', skin: BROWN, background: palette.orange },
  { id: 'zebra', skin: DARK, background: palette.teal },
  { id: 'elephant', skin: BROWN, background: palette.blue },
  { id: 'gorilla', skin: DARK, background: palette.green },
  { id: 'leopard', skin: BROWN, background: palette.pink },
  { id: 'hippo', skin: DARK, background: palette.purple },
  { id: 'cow', skin: LIGHT, background: palette.cyan },
] as const;

const cache = new Map<string, string>();

// The avatar as an SVG document, ready for react-native-svg's SvgXml.
export function avatarSvg(id: string): string {
  const cached = cache.get(id);
  if (cached) return cached;
  const style = AVATARS.find((a) => a.id === id) ?? { skin: BROWN, background: palette.green };
  const svg = createAvatar(adventurer, {
    seed: id,
    skinColor: [style.skin],
    backgroundColor: [style.background.slice(1).toLowerCase()],
    radius: 50,
  }).toString();
  cache.set(id, svg);
  return svg;
}
