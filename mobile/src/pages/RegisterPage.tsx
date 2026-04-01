import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, ErrorText, Field, Heading, Screen } from "../components/ui";
import { createPostAuthResetAction } from "../navigation/authRedirect";
import type { RootStackParamList } from "../navigation/types";
import { palette } from "../theme";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

function formatBirthDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "male" as "male" | "female" | "prefer_not_to_say",
    password: "",
  });
  const [birthDate, setBirthDate] = useState<Date>(new Date("2000-01-01T12:00:00"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const genderOptions: Array<{ value: "male" | "female" | "prefer_not_to_say"; label: string }> = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const onSubmit = async () => {
    setError("");
    setIsRegistering(true);
    try {
      await register({
        ...form,
        birth_date: formatBirthDate(birthDate),
      });
      navigation.dispatch(createPostAuthResetAction());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const onBirthDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }
    setBirthDate(selectedDate);
  };

  return (
    <Screen
    keyboardAware
    >
      <Card>
        <Heading>Register</Heading>
        <Field label="Name" value={form.name} onChangeText={(value) => setForm((p) => ({ ...p, name: value }))} placeholder="Name" />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(value) => setForm((p) => ({ ...p, email: value }))}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <View style={styles.genderWrap}>
          {genderOptions.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.genderChip, form.gender === value && styles.genderChipActive]}
              onPress={() => setForm((p) => ({ ...p, gender: value }))}
            >
              <Text style={[styles.genderLabel, form.gender === value && styles.genderLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Birth Date</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formatBirthDate(birthDate)}</Text>
          </Pressable>
        </View>
        {showDatePicker ? (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={onBirthDateChange}
          />
        ) : null}
        <Field
          label="Password"
          value={form.password}
          onChangeText={(value) => setForm((p) => ({ ...p, password: value }))}
          placeholder="Minimum 8 characters"
          secureTextEntry
        />
        <ErrorText message={error} />
        <Button label={isRegistering ? "Creating account..." : "Register"} onPress={() => void onSubmit()} disabled={isRegistering} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: palette.muted, textTransform: "uppercase" },
  dateButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateButtonText: { color: palette.text, fontSize: 15 },
  genderWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#fff",
  },
  genderChipActive: { backgroundColor: palette.accentMuted, borderColor: palette.accent },
  genderLabel: { color: palette.text, fontWeight: "600" },
  genderLabelActive: { color: palette.accent },
});
