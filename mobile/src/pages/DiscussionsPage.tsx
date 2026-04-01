import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { discussionApi } from "../api/discussions";
import { useRealtimeSocket } from "../api/realtime";
import { DiscussionCard } from "../components/DiscussionCard";
import { Button, Card, CheckboxRow, ErrorText, Field, Heading, Screen } from "../components/ui";
import type { Discussion } from "../types/api";
import { useAuth } from "../auth/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { sortDiscussions } from "../utils/format";

export function DiscussionsPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    try {
      const data = await discussionApi.list();
      setItems(sortDiscussions(data.results));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discussions");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useRealtimeSocket({
    path: "/ws/discussions/",
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "discussion_created"; discussion: Discussion }
          | { type: "discussion_updated"; discussion: Discussion }
          | { type: "discussion_deleted"; discussion_id: string };

        if (payload.type === "discussion_created" || payload.type === "discussion_updated") {
          setItems((prev) => {
            const next = prev.filter((item) => item.id !== payload.discussion.id);
            next.push(payload.discussion);
            return sortDiscussions(next);
          });
          return;
        }

        if (payload.type === "discussion_deleted") {
          setItems((prev) => prev.filter((item) => item.id !== payload.discussion_id));
        }
      } catch {
        // Ignore malformed messages
      }
    },
  });

  const onCreate = async () => {
    setError("");
    setIsCreating(true);
    try {
      const created = await discussionApi.create({ title, content, is_anonymous: isAnonymous });
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      navigation.push("DiscussionDetail", { id: created.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discussion");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Screen>
      {user ? (
        <Card>
          <Heading>Create Discussion</Heading>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="Title" />
          <Field label="First Comment" value={content} onChangeText={setContent} placeholder="Start the thread..." multiline />
          <CheckboxRow label="Start as anonymous discussion" checked={isAnonymous} onPress={() => setIsAnonymous((prev) => !prev)} />
          <Button label={isCreating ? "Creating..." : "Create"} onPress={() => void onCreate()} disabled={isCreating} />
        </Card>
      ) : (
        <Card>
          <Heading>Welcome to the forum</Heading>
          <Button
            label="Login to create a discussion"
            onPress={() =>
              navigation.push("Login", {
                backTitle: "Discussions",
                redirectTo: { name: "MainTabs", params: { screen: "Discussions" } },
              })
            }
          />
        </Card>
      )}

      <ErrorText message={error} />
      {items.map((item) => (
        <DiscussionCard
          key={item.id}
          discussion={item}
          onOpen={() => navigation.push("DiscussionDetail", { id: item.id })}
          onOpenAuthor={(id) => navigation.push("PublicProfile", { id })}
        />
      ))}
    </Screen>
  );
}
