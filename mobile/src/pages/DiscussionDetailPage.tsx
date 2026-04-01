import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Alert, Keyboard, ScrollView, View } from "react-native";
import { discussionApi } from "../api/discussions";
import { useRealtimeSocket } from "../api/realtime";
import { getStoredDeviceId } from "../api/session";
import type { Comment, Discussion, DiscussionDetail } from "../types/api";
import { CommentItem } from "../components/CommentItem";
import { useAuth } from "../auth/AuthContext";
import { BodyText, Button, Card, ErrorText, Field, Heading, Screen } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";
import { formatDateTime } from "../utils/format";

export function DiscussionDetailPage() {
  const route = useRoute<RouteProp<RootStackParamList, "DiscussionDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, accessToken } = useAuth();
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const commentSectionY = useRef(0);

  const discussionId = route.params.id;

  const load = useCallback(async () => {
    try {
      const deviceId = await getStoredDeviceId();
      if (deviceId) {
        await discussionApi.trackView(discussionId, deviceId);
      }
      const data = await discussionApi.get(discussionId);
      setDiscussion(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discussion");
    }
  }, [discussionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeSocket({
    path: `/ws/discussions/${discussionId}/`,
    token: accessToken,
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "comment_created"; comment: Comment; discussion: Discussion }
          | { type: "discussion_updated"; discussion: Discussion }
          | { type: "discussion_deleted"; discussion_id: string };

        if (payload.type === "discussion_deleted") {
          navigation.navigate("MainTabs", { screen: "Discussions" } as never);
          return;
        }

        if (payload.type === "discussion_updated") {
          setDiscussion((prev) => (prev ? { ...prev, ...payload.discussion } : prev));
          return;
        }

        if (payload.type === "comment_created") {
          setDiscussion((prev) => {
            if (!prev) return prev;
            if (prev.comments.some((comment) => comment.id === payload.comment.id)) {
              return { ...prev, ...payload.discussion };
            }
            return {
              ...prev,
              ...payload.discussion,
              comments: [...prev.comments, payload.comment],
            };
          });
        }
      } catch {
        // Ignore malformed messages
      }
    },
  });

  const scrollToCommentSection = useCallback((animated = true) => {
    scrollRef.current?.scrollTo({
      y: Math.max(commentSectionY.current - 24, 0),
      animated,
    });
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      scrollToCommentSection();
    });

    return () => {
      showSubscription.remove();
    };
  }, [scrollToCommentSection]);

  const submitComment = async () => {
    setError("");
    setIsPostingComment(true);
    try {
      const created = await discussionApi.addComment(discussionId, newComment);
      setNewComment("");
      setDiscussion((prev) => {
        if (!prev) return prev;
        if (prev.comments.some((comment) => comment.id === created.id)) {
          return prev;
        }
        return {
          ...prev,
          comments: [...prev.comments, created],
          comments_count: prev.comments_count + 1,
          last_activity: created.updated_at,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const toggleClose = async () => {
    if (!discussion) return;
    try {
      const updated = await discussionApi.setClosed(discussionId, !discussion.is_closed);
      setDiscussion((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update discussion");
    }
  };

  const deleteDiscussion = async () => {
    Alert.alert("Delete discussion", "This will remove the discussion permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await discussionApi.delete(discussionId);
              navigation.navigate("MainTabs", { screen: "Discussions" } as never);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to delete discussion");
            }
          })();
        },
      },
    ]);
  };

  if (!discussion) {
    return (
      <Screen>
        <Card>
          <Heading>Discussion</Heading>
          <ErrorText message={error} />
          <BodyText muted={!error}>Loading discussion...</BodyText>
        </Card>
      </Screen>
    );
  }

  const isOwner = Boolean(user && discussion.created_by.user_id === user.id);
  const canComment = Boolean(user && (!discussion.is_closed || isOwner));

  return (
    <Screen
      keyboardAware
      scrollRef={scrollRef}
      contentContainerStyle={{ gap: 16, paddingBottom: 180 }}
    >
      <Card>
        <Heading>{discussion.title}</Heading>
        <BodyText>Created by: {discussion.created_by.display_name}</BodyText>
        <BodyText muted>Created: {formatDateTime(discussion.created_at)}</BodyText>
        <BodyText muted>Last activity: {formatDateTime(discussion.last_activity)}</BodyText>
        <BodyText muted>
          Views: {discussion.views_count} | Comments: {discussion.comments_count}
        </BodyText>
        {discussion.is_closed ? <ErrorText message="This discussion is closed." /> : null}
        <ErrorText message={error} />
        {isOwner ? (
          <View style={{ gap: 10 }}>
            <Button label={`${discussion.is_closed ? "Reopen" : "Close"} Discussion`} tone="warning" onPress={() => void toggleClose()} />
            <Button label="Delete Discussion" tone="danger" onPress={() => void deleteDiscussion()} />
          </View>
        ) : null}
      </Card>

      {discussion.comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onOpenAuthor={(id) => navigation.push("PublicProfile", { id })}
        />
      ))}

      {canComment ? (
        <View
          onLayout={(event) => {
            commentSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Card>
            <Heading>Add Comment</Heading>
            <Field
              label="Comment"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              placeholder="Share your thoughts..."
              onFocus={() => scrollToCommentSection()}
            />
            <Button label={isPostingComment ? "Posting..." : "Post Comment"} onPress={() => void submitComment()} disabled={isPostingComment} />
          </Card>
        </View>
      ) : (
        <Card>
          <BodyText muted>{user ? "Only the owner can comment on a closed discussion." : "Login to comment."}</BodyText>
          {!user ? (
            <Button
              label="Login"
              onPress={() =>
                navigation.push("Login", {
                  backTitle: "Discussion",
                  redirectTo: { name: "DiscussionDetail", params: { id: discussionId } },
                })
              }
            />
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
