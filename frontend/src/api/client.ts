export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let bodyText = "";
    try {
      bodyText = await res.text();
      if (bodyText) {
        const data = JSON.parse(bodyText);
        msg = data.detail || JSON.stringify(data);
      }
    } catch {
      if (bodyText) {
        msg = bodyText;
      }
    }
    throw new Error(msg);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
