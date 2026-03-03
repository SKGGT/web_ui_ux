import { apiFetch } from "./client";
import type { UserProfile } from "../types/api";

export interface RegisterPayload {
  email: string;
  name: string;
  gender: "male" | "female" | "prefer_not_to_say";
  birth_date: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => apiFetch<UserProfile>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) => apiFetch<UserProfile>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<UserProfile>("/auth/me"),
  setProfileAnonymous: (isProfileAnonymous: boolean) =>
    apiFetch<UserProfile>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ is_profile_anonymous: isProfileAnonymous }),
    }),
  deleteAccount: (deleteContent: boolean) =>
    apiFetch<void>("/account", {
      method: "DELETE",
      body: JSON.stringify({ delete_content: deleteContent }),
    }),
};
