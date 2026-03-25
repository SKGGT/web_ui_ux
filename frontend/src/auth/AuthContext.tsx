import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type LoginPayload, type RegisterPayload } from "../api/auth";
import { connectRealtime } from "../api/realtime";
import type { UserProfile } from "../types/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const socket = connectRealtime("/ws/presence/");
    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (payload) => {
        const me = await authApi.login(payload);
        setUser(me);
      },
      register: async (payload) => {
        const me = await authApi.register(payload);
        setUser(me);
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
      },
      refreshMe,
    }),
    [user, loading, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
