import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Title } from '@/components/ui';
import { colors, font, fonts, space } from '@/theme';

// Required by the licences of the models and recordings Ganira uses.
const CREDITS = [
  {
    what: 'Lesson voice',
    who: 'Kinyarwanda TTS female voice by Digital Umuganda',
    licence: 'CC BY-SA 4.0',
    url: 'https://huggingface.co/DigitalUmuganda/KinyarwandaTTS_female_voice',
  },
  {
    what: 'Reference voice sample',
    who: 'w2v-BERT 2.0 Kinyarwanda ASR examples by Badr M. Abdullah (ASRwanda)',
    licence: 'CC BY 4.0',
    url: 'https://huggingface.co/badrex/w2v-bert-2.0-kinyarwanda-asr',
  },
  {
    what: 'Speech check',
    who: 'w2v-BERT 2.0 Kinyarwanda ASR by Badr M. Abdullah / the ASRwanda team and Digital Umuganda, ONNX export by OpenVoiceOS',
    licence: 'CC BY 4.0',
    url: 'https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx',
  },
  {
    what: 'Video lesson',
    who: 'Daisy speaking Kinyarwanda, by Wikitongues',
    licence: 'CC BY 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:WIKITONGUES-_Daisy_speaking_Kinyarwanda.webm',
  },
  {
    what: 'Design',
    who: 'Layout rules from the Astryx design system by Meta (MIT)',
    licence: 'MIT',
    url: 'https://github.com/meta/astryx',
  },
  {
    what: 'Text font',
    who: 'Open Sans, from Google Fonts',
    licence: 'SIL Open Font License 1.1',
    url: 'https://fonts.google.com/specimen/Open+Sans',
  },
  {
    what: 'Heading font',
    who: 'Satoshi by Indian Type Foundry, from Fontshare',
    licence: 'ITF Free Font License',
    url: 'https://www.fontshare.com/fonts/satoshi',
  },
  {
    what: 'Icons',
    who: 'Lucide',
    licence: 'ISC',
    url: 'https://lucide.dev',
  },
  {
    what: 'Profile pictures',
    who: 'Adventurer by Lisa Wischofsky, drawn with DiceBear',
    licence: 'CC BY 4.0',
    url: 'https://www.dicebear.com/styles/adventurer/',
  },
  {
    what: 'Vibration patterns',
    who: 'Based on web-haptics by Lochie Axon',
    licence: 'MIT',
    url: 'https://github.com/lochie/web-haptics',
  },
  {
    what: 'Sounds',
    who: 'Made for Ganira',
    licence: '',
    url: '',
  },
];

export default function Credits() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Title>Credits</Title>
      {CREDITS.map((c) => (
        <Text key={c.what} style={styles.item}>
          <Text style={styles.what}>{c.what}: </Text>
          {c.who}
          {c.licence ? ` (${c.licence})` : ''}
          {c.url ? (
            <Text style={styles.link} onPress={() => Linking.openURL(c.url)}>
              {'\n'}
              {c.url}
            </Text>
          ) : null}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  item: { fontSize: font.body, fontFamily: fonts.regular, color: colors.text, lineHeight: 22 },
  what: { fontFamily: fonts.bold },
  link: { color: colors.primary, fontSize: font.label, fontFamily: fonts.regular },
});
