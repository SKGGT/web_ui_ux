import { apiFetch } from "./client";
import type { UserProfile } from "../types/api";

export const profileApi = {
  getById: (id: string) => apiFetch<UserProfile>(`/profiles/${id}`),
};
