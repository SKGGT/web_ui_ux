import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { connectRealtime } from "../api/realtime";
import { useAuth } from "../auth/AuthContext";
import type { OnlineUser } from "../types/api";

export function OnlineUsersPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user?.is_staff) {
      return;
    }
    const socket = connectRealtime("/ws/admin/online-users/");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "snapshot" }));
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: "online_users_snapshot"; users: OnlineUser[] };
        if (payload.type === "online_users_snapshot") {
          setUsers(payload.users);
        }
      } catch {
        // Ignore malformed messages
      }
    };
    return () => {
      socket.close();
    };
  }, [user?.is_staff]);

  if (!user?.is_staff) {
    return <p className="text-red-600">Admin access required.</p>;
  }

  if (loading) {
    return <p>Loading online users...</p>;
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Online Users</h1>
        <p className="mt-1 text-sm text-slate-600">Live active users connected through websocket sessions.</p>
      </header>

      {error ? <p className="text-red-600">{error}</p> : null}
      {!users.length && !error ? <p className="text-slate-600">No users currently online.</p> : null}

      {users.length ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Connections</th>
                <th className="px-4 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.is_superuser ? "Superuser" : user.is_staff ? "Admin" : "User"}</td>
                  <td className="px-4 py-3">{user.connections_count}</td>
                  <td className="px-4 py-3">{new Date(user.last_seen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
