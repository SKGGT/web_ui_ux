import { apiFetch } from "./client";
import type { OnlineUser } from "../types/api";

export const adminApi = {
  onlineUsers: () => apiFetch<OnlineUser[]>("/admin/online-users", { auth: true }),
};
