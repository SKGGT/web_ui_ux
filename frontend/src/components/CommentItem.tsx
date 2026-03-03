import { Link } from "react-router-dom";
import type { Comment } from "../types/api";

export function CommentItem({ comment }: { comment: Comment }) {
  const name = comment.author.user_id ? (
    <Link className="underline" to={`/users/${comment.author.user_id}`}>
      {comment.author.display_name}
    </Link>
  ) : (
    comment.author.display_name
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs text-slate-500">
        <span>{name}</span>
        <span className="mx-2">•</span>
        <span>{new Date(comment.created_at).toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-800">{comment.content}</p>
    </div>
  );
}
