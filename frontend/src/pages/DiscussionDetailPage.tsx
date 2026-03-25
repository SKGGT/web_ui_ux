import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { discussionApi } from "../api/discussions";
import { connectRealtime } from "../api/realtime";
import type { Comment, Discussion, DiscussionDetail } from "../types/api";
import { CommentItem } from "../components/CommentItem";
import { useAuth } from "../auth/AuthContext";

export function DiscussionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const discussionId = id ?? "";

  const load = async () => {
    try {
      await discussionApi.trackView(discussionId);
      const data = await discussionApi.get(discussionId);
      setDiscussion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discussion");
    }
  };

  useEffect(() => {
    if (discussionId) {
      void load();
    }
  }, [discussionId]);

  useEffect(() => {
    if (!discussionId) return;

    const socket = connectRealtime(`/ws/discussions/${discussionId}/`);
    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "comment_created"; comment: Comment; discussion: Discussion }
          | { type: "discussion_updated"; discussion: Discussion }
          | { type: "discussion_deleted"; discussion_id: string };

        if (payload.type === "discussion_deleted") {
          navigate("/discussions");
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
    };

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, [discussionId, navigate]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
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
    try {
      await discussionApi.delete(discussionId);
      navigate("/discussions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete discussion");
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!discussion) return <p>Loading discussion...</p>;

  const isOwner = user && discussion.created_by.user_id === user.id;
  const canComment = user && (!discussion.is_closed || isOwner);

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">{discussion.title}</h1>
        <p className="mt-1 text-sm text-slate-600">Created by: {discussion.created_by.display_name}</p>
        <p className="text-sm text-slate-600">Created: {new Date(discussion.created_at).toLocaleString()}</p>
        <p className="text-sm text-slate-600">Last activity: {new Date(discussion.last_activity).toLocaleString()}</p>
        <p className="text-sm text-slate-600">Views: {discussion.views_count} | Comments: {discussion.comments_count}</p>
        {discussion.is_closed ? <p className="mt-2 text-sm font-medium text-red-700">This discussion is closed.</p> : null}

        {isOwner ? (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-warn px-3 py-2" onClick={() => void toggleClose()}>
              {discussion.is_closed ? "Reopen" : "Close"} Discussion
            </button>
            <button className="btn btn-danger px-3 py-2" onClick={() => void deleteDiscussion()}>
              Delete Discussion
            </button>
          </div>
        ) : null}
      </header>

      <section className="space-y-3">
        {discussion.comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </section>

      {canComment ? (
        <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitComment}>
          <h2 className="text-lg font-semibold">Add Comment</h2>
          <textarea className="mt-3 w-full rounded border border-slate-300 px-3 py-2" rows={5} value={newComment} onChange={(e) => setNewComment(e.target.value)} required maxLength={10000} />
          <button className="btn btn-primary mt-3 min-w-36" type="submit" disabled={isPostingComment}>
            {isPostingComment ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">Login to comment. If closed, only the owner can comment.</p>
      )}
    </div>
  );
}
