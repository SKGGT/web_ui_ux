import { StyleSheet, Text, View } from "react-native";
import type { Comment } from "../types/api";
import { palette, spacing } from "../theme";
import { formatDateTime } from "../utils/format";

export function CommentItem({
  comment,
  onOpenAuthor,
}: {
  comment: Comment;
  onOpenAuthor?: (userId: string) => void;
}) {
  const authorId = comment.author.user_id;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {authorId && onOpenAuthor ? (
          <Text style={styles.author} onPress={() => onOpenAuthor(authorId)}>
            {comment.author.display_name}
          </Text>
        ) : (
          <Text style={styles.meta}>{comment.author.display_name}</Text>
        )}
        <Text style={styles.meta}>•</Text>
        <Text style={styles.meta}>{formatDateTime(comment.created_at)}</Text>
      </View>
      <Text style={styles.content}>{comment.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  author: { color: palette.accent, fontWeight: "700" },
  meta: { color: palette.muted, fontSize: 13 },
  content: { color: palette.text, lineHeight: 22, fontSize: 15 },
});
