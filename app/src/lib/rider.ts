// The motari (moto taxi rider) headshot: a rider in a yellow helmet and yellow vest, in the
// same flat cartoon style as the other avatars. Drawn by hand, like the pets, because the
// DiceBear people styles have no helmets.

const SKIN = '#8a4f2a';
const HELMET = '#F2BE00';
const HELMET_EDGE = '#8a6a00';
const VISOR = '#2b2b2b';
const JACKET = '#2b2b2b';
const VEST = '#F5C800';
const REFLECTIVE = '#e9e9e9';
const INK = '#2b2118';

export function riderSvg(background: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    `<defs><clipPath id="rider-circle"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
    `<circle cx="50" cy="50" r="50" fill="#${background}"/>` +
    // Everything below is cut to the circle, so the figure reads as a profile picture.
    `<g clip-path="url(#rider-circle)">` +
    // jacket shoulders
    `<path d="M8 100 Q10 74 34 70 L66 70 Q90 74 92 100 Z" fill="${JACKET}"/>` +
    // yellow vest with a reflective stripe
    `<path d="M30 100 L36 72 L64 72 L70 100 Z" fill="${VEST}"/>` +
    `<path d="M33 88 L67 88" stroke="${REFLECTIVE}" stroke-width="3"/>` +
    // neck
    `<rect x="42" y="60" width="16" height="14" rx="5" fill="${SKIN}"/>` +
    // face
    `<ellipse cx="50" cy="48" rx="19" ry="21" fill="${SKIN}"/>` +
    // helmet: a dome over the top of the head, with a dark edge
    `<path d="M28 50 Q28 16 50 15 Q72 16 72 50 L72 54 L28 54 Z" fill="${HELMET}" stroke="${HELMET_EDGE}" stroke-width="2"/>` +
    `<path d="M36 26 Q42 21 50 21" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>` +
    // visor
    `<path d="M30 46 Q50 40 70 46 L70 52 Q50 56 30 52 Z" fill="${VISOR}" opacity="0.85"/>` +
    // smile
    `<path d="M43 66 Q50 71 57 66" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `</g></svg>`
  );
}
