import { apiFetch } from "./client";
import type { AsyncOperation, OnlineUser } from "../types/api";

export const adminApi = {
  onlineUsers: () => apiFetch<OnlineUser[]>("/admin/online-users"),
  asyncOperations: () => apiFetch<AsyncOperation[]>("/admin/async-operations"),
  sendGroupEmail: (payload: { group: "staff" | "non_staff"; subject: string; message: string }) =>
    apiFetch<AsyncOperation>("/admin/async-operations/email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  runForumLongOP: (payload: { seconds: number }) =>
    apiFetch<AsyncOperation>("/admin/async-operations/forum-longop", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
