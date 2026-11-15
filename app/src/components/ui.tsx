import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
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
import { haptics } from '@/lib/haptics';
import { colors, font, fonts, icon as iconSize, radius, space } from '@/theme';

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
        {checked ? <Check size={18} color={colors.primaryText} strokeWidth={3} /> : null}
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

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';

const BUTTON_COLORS: Record<ButtonVariant, { face: string; edge: string; text: string; border?: string }> = {
  primary: { face: colors.primary, edge: colors.primaryEdge, text: colors.primaryText },
  secondary: { face: colors.surface, edge: colors.borderStrong, text: colors.primary, border: colors.borderStrong },
  success: { face: colors.success, edge: '#2A5400', text: colors.primaryText },
  danger: { face: colors.error, edge: '#8F0000', text: colors.primaryText },
};

// A raised button with a darker lip underneath, like Duolingo's; it sinks when pressed.
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  busy?: boolean;
  disabled?: boolean;
}) {
  const c = BUTTON_COLORS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.face, borderBottomColor: c.edge },
        c.border ? { borderColor: c.border, borderWidth: 2, borderBottomWidth: 4 } : null,
        (disabled || busy) && styles.disabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <View style={styles.buttonRow}>
          {Icon ? <Icon size={iconSize.size} color={c.text} strokeWidth={iconSize.stroke} /> : null}
          <Text style={[styles.buttonText, { color: c.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// A round icon-only button, e.g. "close" or "play again". The label is for screen readers.
export function IconButton({
  icon: Icon,
  label,
  onPress,
  size = iconSize.size,
  color = colors.muted,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Icon size={size} color={color} strokeWidth={iconSize.stroke} />
    </Pressable>
  );
}

export type ChoiceStatus = 'none' | 'selected' | 'correct' | 'wrong';

// One tappable option in a list of answers, e.g. a level, a daily goal or a quiz answer.
// After an answer is checked, the right option turns green and a wrong pick turns red.
export function Choice({
  label,
  hint,
  selected,
  status,
  disabled = false,
  onPress,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  status?: ChoiceStatus;
  disabled?: boolean;
  onPress: () => void;
}) {
  const state: ChoiceStatus = status ?? (selected ? 'selected' : 'none');
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: state !== 'none', disabled }}
      accessibilityLabel={state === 'correct' ? `${label}, right answer` : state === 'wrong' ? `${label}, wrong answer` : label}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        state === 'selected' && styles.choiceSelected,
        state === 'correct' && styles.choiceCorrect,
        state === 'wrong' && styles.choiceWrong,
        pressed && styles.choicePressed,
      ]}
    >
      <Text
        style={[
          styles.choiceLabel,
          state === 'correct' && { color: colors.success },
          state === 'wrong' && { color: colors.error },
        ]}
      >
        {label}
      </Text>
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
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { flex: 1, fontSize: font.body, fontFamily: fonts.regular, color: colors.text },
  title: { fontSize: font.title, fontFamily: fonts.heading, color: colors.text, lineHeight: font.title * 1.2 },
  body: { fontSize: font.body, fontFamily: fonts.regular, color: colors.muted, lineHeight: 22 },
  error: { fontSize: font.label, fontFamily: fonts.regular, color: colors.error },
  // 50 px tall plus a 4 px lip: Astryx's large element (44 px) with room for a finger.
  button: {
    minHeight: 54,
    borderRadius: radius + 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  buttonPressed: { borderBottomWidth: 0, marginTop: 4, minHeight: 50 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  buttonText: { fontSize: font.body, fontFamily: fonts.bold, letterSpacing: 0.3 },
  iconButton: { padding: space.xs, borderRadius: 999 },
  choice: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius + 2,
    padding: space.md,
    gap: space.xs,
  },
  choicePressed: { borderBottomWidth: 2, marginTop: 2 },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.selected },
  choiceCorrect: { borderColor: colors.success, backgroundColor: colors.successSoft },
  choiceWrong: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  choiceLabel: { fontSize: font.body, fontFamily: fonts.semibold, color: colors.text },
  choiceHint: { fontSize: font.label, fontFamily: fonts.regular, color: colors.muted },
  field: { gap: space.xs },
  label: { fontSize: font.label, color: colors.text, fontFamily: fonts.semibold },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: space.md,
    fontSize: font.body,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
