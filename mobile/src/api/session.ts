import AsyncStorage from "@react-native-async-storage/async-storage";
import { createUuid } from "../utils/format";

type SessionHandlers = {
  refreshAccessToken: () => Promise<string | null>;
  onAuthFailure: () => Promise<void>;
};

const DEVICE_ID_KEY = "device_id";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let handlers: SessionHandlers = {
  refreshAccessToken: async () => null,
  onAuthFailure: async () => undefined,
};

export function setSessionTokens(nextAccessToken: string | null, nextRefreshToken: string | null) {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
}

export function registerSessionHandlers(nextHandlers: Partial<SessionHandlers>) {
  handlers = { ...handlers, ...nextHandlers };
}

export function getSessionAccessToken() {
  return accessToken;
}

export function hasSessionRefreshToken() {
  return Boolean(refreshToken);
}

export async function refreshSessionAccessToken() {
  return handlers.refreshAccessToken();
}

export async function handleSessionAuthFailure() {
  await handlers.onAuthFailure();
}

export async function getStoredDeviceId() {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }

  const nextId = createUuid();
  await AsyncStorage.setItem(DEVICE_ID_KEY, nextId);
  return nextId;
}
