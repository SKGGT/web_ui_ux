function websocketUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}${path}`;
}

export function connectRealtime(path: string): WebSocket {
  return new WebSocket(websocketUrl(path));
}
