import { Link } from "react-router-dom";
import type { Discussion } from "../types/api";

export function DiscussionCard({ discussion }: { discussion: Discussion }) {
  const createdBy = discussion.created_by.user_id ? (
    <Link className="underline" to={`/users/${discussion.created_by.user_id}`}>
      {discussion.created_by.display_name}
    </Link>
  ) : (
    discussion.created_by.display_name
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Link to={`/discussions/${discussion.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
        {discussion.title}
      </Link>
      <div className="mt-2 text-sm text-slate-600">
        <div>Created by: {createdBy}</div>
        <div>Created: {new Date(discussion.created_at).toLocaleString()}</div>
        <div>Last activity: {new Date(discussion.last_activity).toLocaleString()}</div>
        <div>Views: {discussion.views_count}</div>
        <div>Comments: {discussion.comments_count}</div>
      </div>
      {discussion.is_closed ? <div className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs text-red-700">Closed</div> : null}
    </article>
  );
}
