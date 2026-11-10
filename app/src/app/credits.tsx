import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Title } from '@/components/ui';
import { colors, font, space } from '@/theme';

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
  item: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  what: { fontWeight: '700' },
  link: { color: colors.primary, fontSize: font.label },
});
