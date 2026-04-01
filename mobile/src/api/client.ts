import {
  getSessionAccessToken,
  handleSessionAuthFailure,
  hasSessionRefreshToken,
  refreshSessionAccessToken,
} from "./session";

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is required");
}

const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

function buildUrl(path: string) {
  return `${API_BASE_URL}/api${path}`;
}

async function parseError(res: Response) {
  const message = `Request failed (${res.status})`;
  const bodyText = await res.text();
  if (!bodyText) {
    return message;
  }

  try {
    const data = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return data.detail;
    }
    return JSON.stringify(data);
  } catch {
    return bodyText;
  }
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  retryOn401?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = false, retryOn401 = true, headers: initialHeaders, ...rest } = options;
  const headers = new Headers(initialHeaders ?? {});
  const url = buildUrl(path);

  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const access = getSessionAccessToken();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Network request failed for ${url}: ${reason}`);
  }

  if (res.status === 401 && auth && retryOn401 && hasSessionRefreshToken()) {
    const refreshedAccess = await refreshSessionAccessToken();
    if (refreshedAccess) {
      return apiFetch<T>(path, {
        ...options,
        retryOn401: false,
        headers: initialHeaders,
      });
    }
    await handleSessionAuthFailure();
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
