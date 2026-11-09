import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AVATARS } from '@/lib/avatars';
import { colors, font, radius, space } from '@/theme';

export function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Avatar</Text>
      <View style={styles.row}>
        {AVATARS.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={a.id}
            accessibilityState={{ selected: value === a.id }}
            onPress={() => onChange(a.id)}
            style={[styles.avatar, value === a.id && styles.selected]}
          >
            <Text style={styles.emoji}>{a.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { fontSize: font.label, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.primary },
  emoji: { fontSize: 30 },
});
