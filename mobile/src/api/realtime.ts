import { useEffect, useRef } from "react";

const rawWsBaseUrl = process.env.EXPO_PUBLIC_WS_BASE_URL;

if (!rawWsBaseUrl) {
  throw new Error("EXPO_PUBLIC_WS_BASE_URL is required");
}

const WS_BASE_URL = rawWsBaseUrl.replace(/\/$/, "");

export function connectRealtime(path: string, token?: string | null): WebSocket {
  const suffix = token ? `${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : "";
  return new WebSocket(`${WS_BASE_URL}${path}${suffix}`);
}

export function useRealtimeSocket({
  path,
  token,
  enabled = true,
  heartbeatMs = 30000,
  onOpen,
  onMessage,
}: {
  path: string;
  token?: string | null;
  enabled?: boolean;
  heartbeatMs?: number;
  onOpen?: (socket: WebSocket) => void;
  onMessage?: (event: MessageEvent) => void;
}) {
  const onOpenRef = useRef(onOpen);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onOpenRef.current = onOpen;
    onMessageRef.current = onMessage;
  }, [onMessage, onOpen]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = connectRealtime(path, token);
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    socket.onopen = () => {
      onOpenRef.current?.(socket);
    };

    socket.onmessage = (event) => {
      onMessageRef.current?.(event);
    };

    if (heartbeatMs > 0) {
      heartbeat = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, heartbeatMs);
    }

    return () => {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      socket.close();
    };
  }, [enabled, heartbeatMs, path, token]);
}
