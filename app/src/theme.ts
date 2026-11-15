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
  primaryEdge: '#262C10', // the darker lip under a primary button
  primaryText: '#FFFFFF', // --color-on-accent
  border: '#DCE3CE', // --color-border
  borderStrong: '#B7C29E', // --color-border-emphasized
  success: '#3D7A00', // --color-text-success: right answers, words the speech check heard
  successSoft: '#3D7A001F',
  error: '#CC0000', // --color-text-error: wrong answers
  errorSoft: '#CC00001A',
};

// Matcha's nine color families (palette.config.json seeds), for icons, lesson
// circles and celebrations.
export const palette = {
  red: '#FD0000',
  orange: '#C47620',
  yellow: '#E8B800',
  green: '#4D9900',
  teal: '#2E6B5A',
  cyan: '#3A7C7C',
  blue: '#3A5E8C',
  purple: '#6B4A8C',
  pink: '#C44A70',
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

export const radius = 12; // --radius-element: buttons, fields, options
export const radiusLarge = 18; // --radius-container: cards and panels

// Icons: one size and stroke everywhere, so they look like one set.
export const icon = { size: 22, large: 30, stroke: 2.25 };

// --shadow-low, in React Native form.
export const shadow = {
  shadowColor: '#3E481D',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
