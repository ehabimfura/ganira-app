// Two pet avatars drawn in plain SVG (DiceBear has no animal styles). Each sits on a round
// background, like the people avatars, so they match in the picker and on the profile.

const CAT_FUR = '#9aa0a6';
const DOG_FUR = '#c98a4b';
const DOG_EARS = '#7a4a22';
const INK = '#2b2118';
const NOSE = '#d9707a';

function frame(background: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    `<circle cx="50" cy="50" r="50" fill="#${background}"/>${body}</svg>`
  );
}

export function catSvg(background: string): string {
  return frame(
    background,
    [
      // ears
      `<polygon points="24,44 28,16 48,32" fill="${CAT_FUR}"/>`,
      `<polygon points="76,44 72,16 52,32" fill="${CAT_FUR}"/>`,
      `<polygon points="30,38 32,25 42,33" fill="#e6b8bd"/>`,
      `<polygon points="70,38 68,25 58,33" fill="#e6b8bd"/>`,
      // head
      `<ellipse cx="50" cy="56" rx="29" ry="25" fill="${CAT_FUR}"/>`,
      // eyes, nose, mouth
      `<circle cx="40" cy="52" r="4" fill="${INK}"/>`,
      `<circle cx="60" cy="52" r="4" fill="${INK}"/>`,
      `<polygon points="46,62 54,62 50,67" fill="${NOSE}"/>`,
      `<path d="M50 67 Q46 72 42 70 M50 67 Q54 72 58 70" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      // whiskers
      `<path d="M28 62 L14 59 M28 67 L14 68 M72 62 L86 59 M72 67 L86 68" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`,
    ].join(''),
  );
}

export function dogSvg(background: string): string {
  return frame(
    background,
    [
      // floppy ears
      `<ellipse cx="22" cy="50" rx="9" ry="16" fill="${DOG_EARS}"/>`,
      `<ellipse cx="78" cy="50" rx="9" ry="16" fill="${DOG_EARS}"/>`,
      // head and muzzle
      `<ellipse cx="50" cy="52" rx="27" ry="26" fill="${DOG_FUR}"/>`,
      `<ellipse cx="50" cy="68" rx="14" ry="10" fill="#f1dcc0"/>`,
      // eyes, nose, tongue
      `<circle cx="40" cy="47" r="4" fill="${INK}"/>`,
      `<circle cx="60" cy="47" r="4" fill="${INK}"/>`,
      `<ellipse cx="50" cy="63" rx="5" ry="4" fill="${INK}"/>`,
      `<path d="M46 72 Q50 80 54 72 Z" fill="${NOSE}"/>`,
    ].join(''),
  );
}
