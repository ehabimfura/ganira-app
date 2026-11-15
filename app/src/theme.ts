// One place for the app's look: Meta's Astryx design system, Matcha theme
// (https://github.com/meta/astryx, MIT). Astryx's components are web-only, so its
// light-mode design tokens are carried over here by hand from @astryxdesign/theme-matcha.

export const colors = {
  background: '#F0F0E0', // --color-background-body
  surface: '#FFFFFF', // --color-background-card
  selected: '#3E481D14', // --color-accent-muted
  text: '#3E481D', // --color-text-primary
  muted: '#5A6B2A', // --color-text-secondary
  primary: '#3E481D', // --color-accent
  primaryText: '#FFFFFF', // --color-on-accent
  border: '#DCE3CE', // --color-border
  borderStrong: '#B7C29E', // --color-border-emphasized
  success: '#3D7A00', // --color-text-success: words the speech check heard
  error: '#CC0000', // --color-text-error
};

// Astryx spacing runs in steps of 6 px.
export const space = { xs: 6, sm: 12, md: 18, lg: 24, xl: 42 };

// Body text is DM Sans; headings use the theme's handwriting face, Playwrite US Trad.
// In React Native each weight is its own font file, so weights are chosen by family name.
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  heading: 'PlaywriteUSTrad_400Regular',
};

export const font = { body: 16, label: 13, title: 25, hero: 39 };

export const radius = 12; // --radius-element: buttons, fields, options
export const radiusLarge = 18; // --radius-container: cards and panels

// --shadow-low, in React Native form.
export const shadow = {
  shadowColor: '#3E481D',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
