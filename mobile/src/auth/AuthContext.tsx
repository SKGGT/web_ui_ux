import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authApi, type LoginPayload, type RegisterPayload } from "../api/auth";
import { useRealtimeSocket } from "../api/realtime";
import { registerSessionHandlers, setSessionTokens } from "../api/session";
import type { UserProfile } from "../types/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const presenceSocketRef = useRef<WebSocket | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  const clearSession = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }, []);

  const persistTokens = useCallback(async (nextAccess: string, nextRefresh?: string | null) => {
    setAccessToken(nextAccess);
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, nextAccess);

    if (typeof nextRefresh === "string") {
      setRefreshToken(nextRefresh);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefresh);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshTokenRef.current) {
      return null;
    }

    try {
      const response = await authApi.refresh(refreshTokenRef.current);
      await persistTokens(response.access);
      return response.access;
    } catch {
      await clearSession();
      return null;
    }
  }, [clearSession, persistTokens]);

  const refreshMe = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    registerSessionHandlers({
      refreshAccessToken,
      onAuthFailure: clearSession,
    });
  }, [clearSession, refreshAccessToken]);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
    setSessionTokens(accessToken, refreshToken);
  }, [accessToken, refreshToken]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedAccess, storedRefresh] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ]);

        if (storedAccess) {
          setAccessToken(storedAccess);
        }
        if (storedRefresh) {
          setRefreshToken(storedRefresh);
        }

        if (!storedAccess && storedRefresh) {
          const refreshed = await authApi.refresh(storedRefresh);
          setAccessToken(refreshed.access);
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, refreshed.access);
        }

        if (storedAccess || storedRefresh) {
          await refreshMe();
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [clearSession, refreshMe]);

  useRealtimeSocket({
    path: "/ws/presence/",
    token: accessToken,
    enabled: Boolean(user && accessToken),
    onOpen: (socket) => {
      presenceSocketRef.current = socket;
    },
  });

  useEffect(() => {
    if (!user || !accessToken) {
      presenceSocketRef.current = null;
    }
  }, [accessToken, user]);

  const value: AuthContextValue = {
    user,
    loading,
    accessToken,
    login: async (payload) => {
      const response = await authApi.login(payload);
      await persistTokens(response.access, response.refresh);
      setUser(response.user);
    },
    register: async (payload) => {
      const response = await authApi.register(payload);
      await persistTokens(response.access, response.refresh);
      setUser(response.user);
    },
    logout: clearSession,
    refreshMe,
    getAccessToken: async () => accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
