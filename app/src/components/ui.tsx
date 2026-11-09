import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '@/theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

// A screen with text fields: scrolls, and moves up out of the keyboard's way.
export function FormScreen({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {message}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  busy?: boolean;
  disabled?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        (disabled || busy) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? colors.primaryText : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.primaryText : colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// One tappable option in a list of answers, e.g. a level or a daily goal.
export function Choice({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
    </Pressable>
  );
}

export function Field({ label, ...input }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, padding: space.lg, gap: space.md },
  form: { padding: space.lg, gap: space.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.primaryText, fontWeight: '800' },
  checkLabel: { flex: 1, fontSize: font.body, color: colors.text },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.muted, lineHeight: 22 },
  error: { fontSize: font.label, color: colors.error },
  button: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: font.body, fontWeight: '600' },
  choice: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    padding: space.md,
    gap: space.xs,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  choiceLabel: { fontSize: font.body, fontWeight: '600', color: colors.text },
  choiceHint: { fontSize: font.label, color: colors.muted },
  field: { gap: space.xs },
  label: { fontSize: font.label, color: colors.text, fontWeight: '600' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: space.md,
    fontSize: font.body,
    color: colors.text,
  },
});
