import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Discussion } from "../types/api";
import { palette, spacing } from "../theme";
import { formatDateTime } from "../utils/format";

export function DiscussionCard({
  discussion,
  onOpen,
  onOpenAuthor,
}: {
  discussion: Discussion;
  onOpen: () => void;
  onOpenAuthor?: (userId: string) => void;
}) {
  const userId = discussion.created_by.user_id;

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <Text style={styles.title}>{discussion.title}</Text>
      <View style={styles.metaWrap}>
        <Text style={styles.metaLabel}>Created by:</Text>
        {userId && onOpenAuthor ? (
          <Text style={styles.author} onPress={() => onOpenAuthor(userId)}>
            {discussion.created_by.display_name}
          </Text>
        ) : (
          <Text style={styles.metaValue}>{discussion.created_by.display_name}</Text>
        )}
        <Text style={styles.metaValue}>Created: {formatDateTime(discussion.created_at)}</Text>
        <Text style={styles.metaValue}>Last activity: {formatDateTime(discussion.last_activity)}</Text>
        <Text style={styles.metaValue}>Views: {discussion.views_count}</Text>
        <Text style={styles.metaValue}>Comments: {discussion.comments_count}</Text>
      </View>
      {discussion.is_closed ? <Text style={styles.badge}>Closed</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: "700", color: palette.text },
  metaWrap: { gap: 4 },
  metaLabel: { fontSize: 13, color: palette.muted },
  metaValue: { fontSize: 14, color: palette.muted },
  author: { fontSize: 14, color: palette.accent, fontWeight: "600" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.dangerMuted,
    color: palette.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
