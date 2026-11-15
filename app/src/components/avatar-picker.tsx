import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { AVATARS } from '@/lib/avatars';
import { colors, font, fonts, space } from '@/theme';

export function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Avatar</Text>
      <View style={styles.row}>
        {AVATARS.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={`Avatar ${AVATARS.indexOf(a) + 1}`}
            accessibilityState={{ selected: value === a.id }}
            onPress={() => onChange(a.id)}
            style={[styles.avatar, value === a.id && styles.selected]}
          >
            <Avatar id={a.id} size={52} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { fontSize: font.label, fontFamily: fonts.semibold, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.primary },
});
