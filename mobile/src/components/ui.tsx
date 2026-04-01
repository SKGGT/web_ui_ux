import type { PropsWithChildren } from "react";
import type { ScrollView as ScrollViewType, StyleProp, ViewStyle } from "react-native";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, radius, spacing } from "../theme";

export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
  scrollRef,
  contentContainerStyle,
}: PropsWithChildren<{
  scroll?: boolean;
  keyboardAware?: boolean;
  scrollRef?: React.RefObject<ScrollViewType | null>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>) {
  const content = scroll ? (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.screenContent}
      style={styles.scrollView}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
    >
      <View style={contentContainerStyle}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, contentContainerStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return <SafeAreaView style={styles.safeArea}>{wrappedContent}</SafeAreaView>;
}

export function Card({ children, tone = "default" }: PropsWithChildren<{ tone?: "default" | "danger" | "warning" }>) {
  return <View style={[styles.card, tone === "danger" && styles.cardDanger, tone === "warning" && styles.cardWarning]}>{children}</View>;
}

export function Heading({ children }: PropsWithChildren) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function BodyText({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.bodyText, muted && styles.mutedText]}>{children}</Text>;
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

export function Button({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger" | "warning";
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.secondaryButton,
        tone === "danger" && styles.dangerButton,
        tone === "warning" && styles.warningButton,
        (pressed || disabled) && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          tone === "secondary" && styles.secondaryButtonText,
          tone === "warning" && styles.warningButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
  onFocus?: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        onFocus={onFocus}
      />
    </View>
  );
}

export function CheckboxRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
      <Text style={styles.bodyText}>{label}</Text>
    </Pressable>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={palette.accent} />
      <Text style={styles.mutedText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  keyboardWrap: { flex: 1 },
  scrollView: { flex: 1 },
  screenContent: { padding: spacing.md },
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardDanger: { backgroundColor: palette.dangerMuted, borderColor: palette.dangerMutedBoard },
  cardWarning: { backgroundColor: palette.warningMuted, borderColor: palette.warningMutedBoard },
  heading: { fontSize: 26, fontWeight: "700", color: palette.text },
  bodyText: { fontSize: 15, lineHeight: 22, color: palette.text },
  mutedText: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  errorText: { color: palette.danger, fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButton: { backgroundColor: palette.accentMuted },
  dangerButton: { backgroundColor: palette.danger },
  warningButton: { backgroundColor: palette.warningMuted },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButtonText: { color: palette.accent },
  warningButtonText: { color: palette.warning },
  fieldWrap: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: palette.muted, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    backgroundColor: "#fff",
    color: palette.text,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.accent,
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: palette.accent },
  loadingWrap: { gap: spacing.sm, alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg },
});
