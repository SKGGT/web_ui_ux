import { apiFetch } from "./client";
import type { TokenAuthResponse, UserProfile } from "../types/api";

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
  register: (payload: RegisterPayload) =>
    apiFetch<TokenAuthResponse>("/auth/token/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    apiFetch<TokenAuthResponse>("/auth/token/login", { method: "POST", body: JSON.stringify(payload) }),
  refresh: (refresh: string) =>
    apiFetch<{ access: string }>("/auth/token/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),
  me: () => apiFetch<UserProfile>("/auth/me", { auth: true }),
  setProfileAnonymous: (isProfileAnonymous: boolean) =>
    apiFetch<UserProfile>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ is_profile_anonymous: isProfileAnonymous }),
      auth: true,
    }),
  deleteAccount: (deleteContent: boolean) =>
    apiFetch<void>("/account", {
      method: "DELETE",
      body: JSON.stringify({ delete_content: deleteContent }),
      auth: true,
    }),
};
