import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { discussionApi } from "../api/discussions";
import { connectRealtime } from "../api/realtime";
import { DiscussionCard } from "../components/DiscussionCard";
import type { Discussion } from "../types/api";
import { useAuth } from "../auth/AuthContext";

export function DiscussionsPage() {
  const navigate = useNavigate();
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
      setItems(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discussions");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const socket = connectRealtime("/ws/discussions/");
    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    const sortItems = (values: Discussion[]) =>
      [...values].sort((a, b) => {
        if (a.views_count !== b.views_count) {
          return b.views_count - a.views_count;
        }
        const activityDiff = new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        if (activityDiff !== 0) {
          return activityDiff;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "discussion_created"; discussion: Discussion }
          | { type: "discussion_updated"; discussion: Discussion }
          | { type: "discussion_deleted"; discussion_id: string };

        if (payload.type === "discussion_created" || payload.type === "discussion_updated") {
          setItems((prev) => {
            const next = prev.filter((item) => item.id !== payload.discussion.id);
            next.push(payload.discussion);
            return sortItems(next);
          });
          return;
        }

        if (payload.type === "discussion_deleted") {
          setItems((prev) => prev.filter((item) => item.id !== payload.discussion_id));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      const created = await discussionApi.create({ title, content, is_anonymous: isAnonymous });
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      navigate(`/discussions/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discussion");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {user ? (
        <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={onCreate}>
          <h2 className="text-lg font-semibold">Create Discussion</h2>
          <input className="mt-3 w-full rounded border border-slate-300 px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          <textarea className="mt-3 w-full rounded border border-slate-300 px-3 py-2" rows={5} placeholder="First comment" value={content} onChange={(e) => setContent(e.target.value)} required maxLength={10000} />
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            Start as anonymous discussion
          </label>
          <button className="btn btn-primary mt-3 min-w-32" type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-red-600">{error}</p> : null}
      <section className="space-y-3">
        {items.map((item) => (
          <DiscussionCard key={item.id} discussion={item} />
        ))}
      </section>
    </div>
  );
}
