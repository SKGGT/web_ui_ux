import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { useRealtimeSocket } from "../api/realtime";
import { useAuth } from "../auth/AuthContext";
import type { OnlineUser } from "../types/api";
import { BodyText, Card, ErrorText, Heading, Screen } from "../components/ui";
import { formatDateTime } from "../utils/format";
import { Text } from "react-native";
import { palette } from "../theme";

export function OnlineUsersPage() {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await adminApi.onlineUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load online users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.is_staff) {
      setLoading(false);
      return;
    }
    void load();
  }, [user?.is_staff]);

  useRealtimeSocket({
    path: "/ws/admin/online-users/",
    token: accessToken,
    enabled: Boolean(user?.is_staff),
    onOpen: (socket) => {
      socket.send(JSON.stringify({ type: "snapshot" }));
    },
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: "online_users_snapshot"; users: OnlineUser[] };
        if (payload.type === "online_users_snapshot") {
          setUsers(payload.users);
        }
      } catch {
        // Ignore malformed messages
      }
    },
  });

  if (!user?.is_staff) {
    return (
      <Screen>
        <Card>
          <Heading>Online Users</Heading>
          <BodyText muted>Admin access required.</BodyText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Heading>Online Users</Heading>
        <BodyText muted>Live active users connected through websocket sessions.</BodyText>
        <ErrorText message={error} />
        {loading ? <BodyText muted>Loading online users...</BodyText> : null}
        {!users.length && !loading && !error ? <BodyText muted>No users currently online.</BodyText> : null}
      </Card>
      {users.map((item) => (
        <Card key={item.id}>
          <Text style={{ color: palette.text, fontWeight: "700", fontSize: 18 }}>{item.name}</Text>
          <Text style={{ color: palette.muted }}>{item.email}</Text>
          <Text style={{ color: palette.muted }}>
            {item.is_superuser ? "Superuser" : item.is_staff ? "Admin" : "User"} • {item.connections_count} connection(s)
          </Text>
          <Text style={{ color: palette.muted }}>Last seen: {formatDateTime(item.last_seen)}</Text>
        </Card>
      ))}
    </Screen>
  );
}
