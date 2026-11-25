// One place for the app's look. Ganira's own palette: cyan and blue as the main colours,
// with yellow and mint as accents. Layout rules (spacing, radii, fonts) follow Meta's
// Astryx design system (https://github.com/meta/astryx, MIT), carried over by hand because
// Astryx's components are web-only.

// Bright colours do not pass contrast on white, so text on them is always the dark ink,
// and text in an accent colour uses the darker "ink" version of that colour.
const INK = '#0B1A2B';

export const colors = {
  background: '#F5F5F7', // Apple's light background
  surface: '#FFFFFF',
  selected: '#48DBFB2E', // cyan, faint, for a picked option
  text: INK,
  muted: '#4A5A6E',
  primary: '#48DBFB', // main colour: primary buttons, selected pairs
  primaryEdge: '#1FA9CC', // the darker lip under a primary button
  primaryText: INK,
  secondary: '#54A0FF',
  secondaryEdge: '#2F6FD0',
  border: '#DDE3EA',
  borderStrong: '#B5C0CC',
  success: '#1DD1A1', // fills: right answers, words the speech check heard
  successEdge: '#0FA57E',
  successText: '#0B7A5C', // text in success colour (passes contrast on white)
  successSoft: '#1DD1A126',
  error: '#C4252B', // wrong answers (no red in the palette, so a deep red)
  errorEdge: '#8E1A1F',
  errorSoft: '#C4252B1A',
  inkYellow: '#8A5A00', // text in yellow
  inkBlue: '#2A6FCC', // text in blue
  inkGreen: '#0B7A5C', // text in green (same as successText)
};

// The four palette colours, for icons, lesson circles, avatars and celebrations.
export const palette = {
  cyan: '#48DBFB',
  blue: '#54A0FF',
  yellow: '#FECA57',
  green: '#1DD1A1',
};

// Astryx spacing runs in steps of 6 px.
export const space = { xs: 6, sm: 12, md: 18, lg: 24, xl: 42 };

// Body text is Open Sans; headings are Satoshi. In React Native each weight is its
// own font file, so weights are chosen by family name.
export const fonts = {
  regular: 'OpenSans_400Regular',
  medium: 'OpenSans_500Medium',
  semibold: 'OpenSans_600SemiBold',
  bold: 'OpenSans_700Bold',
  heading: 'Satoshi-Black',
  headingBold: 'Satoshi-Bold',
  headingMedium: 'Satoshi-Medium',
};

export const font = { body: 16, label: 13, title: 26, hero: 40 };

export const radius = 12; // buttons, fields, options
export const radiusLarge = 18; // cards and panels

// Icons: one size and stroke everywhere, so they look like one set.
export const icon = { size: 22, large: 30, stroke: 2.25 };

// A soft shadow in React Native form.
export const shadow = {
  shadowColor: INK,
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
