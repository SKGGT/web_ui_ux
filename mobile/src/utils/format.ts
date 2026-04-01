export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Hidden";
  return value;
}

export function sortDiscussions<T extends { views_count: number; last_activity: string; created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.views_count !== b.views_count) {
      return b.views_count - a.views_count;
    }
    const activityDiff = new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    if (activityDiff !== 0) {
      return activityDiff;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function createUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
