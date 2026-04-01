import { StyleSheet, Text, View } from "react-native";
import type { UserProfile } from "../types/api";
import { palette, spacing } from "../theme";
import { formatDate, formatDateTime } from "../utils/format";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  prefer_not_to_say: "Prefer not to say",
};

export function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{profile.name}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email ?? "Hidden"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Gender</Text>
        <Text style={styles.value}>{profile.gender ? GENDER_LABELS[profile.gender] || profile.gender : "Hidden"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Date of Birth</Text>
        <Text style={styles.value}>{formatDate(profile.birth_date)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Joined</Text>
        <Text style={styles.value}>{formatDateTime(profile.date_joined)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "700", color: palette.text, marginBottom: 4 },
  row: { gap: 2 },
  label: { color: palette.muted, textTransform: "uppercase", fontSize: 12, fontWeight: "700" },
  value: { color: palette.text, fontSize: 15, lineHeight: 21 },
});
