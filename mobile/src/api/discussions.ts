import { apiFetch } from "./client";
import type { Comment, Discussion, DiscussionDetail, Paginated } from "../types/api";

export const discussionApi = {
  list: () => apiFetch<Paginated<Discussion>>("/discussions"),
  create: (payload: { title: string; content: string; is_anonymous: boolean }) =>
    apiFetch<Discussion>("/discussions", { method: "POST", body: JSON.stringify(payload), auth: true }),
  get: (id: string) => apiFetch<DiscussionDetail>(`/discussions/${id}`),
  addComment: (id: string, content: string) =>
    apiFetch<Comment>(`/discussions/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
      auth: true,
    }),
  setClosed: (id: string, is_closed: boolean) =>
    apiFetch<Discussion>(`/discussions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_closed }),
      auth: true,
    }),
  delete: (id: string) => apiFetch<void>(`/discussions/${id}`, { method: "DELETE", auth: true }),
  trackView: async (id: string, deviceId: string) =>
    apiFetch<{ counted: boolean }>(`/discussions/${id}/view`, {
      method: "POST",
      headers: { "X-Device-Id": deviceId },
    }),
};
