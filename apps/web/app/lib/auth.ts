import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zustand local storage to manage user authentication tokens
type AuthType = {
  accessToken: string | null;
  refreshToken: string | null;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  clearAccessToken: () => void;
  clearRefreshToken: () => void;
};

export const userAuthStore = create<AuthType>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      clearAccessToken: () => set({ accessToken: null }),
      clearRefreshToken: () => set({ refreshToken: null }),
    }),
    {
      name: "auth-storage", // key name to be saved in localStorage
    }
  )
);

/**
 * Decode JWT token to information containing exp and userId
 * (e.g. "xxxx.yyyy.zzzz" -> { userId: "abc", exp: 1234567890 });)
 * @param token - The string JWT token to decode
 * @returns The decoded payload or null if decoding fails
 */
type JwtPayload =
  | (Record<string, unknown> & {
      userId?: string | null;
      exp?: number | null;
    })
  | null;
const decodeJwt = (token: string | null): JwtPayload => {
  if (!token) return null;
  try {
    let base64 = token.split(".")[1];
    if (!base64) return null;

    // Convert Base64URL → Base64; add padding if necessary
    base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);

    let payload: string;
    if (typeof atob === "function") {
      // Browser environment
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      payload = new TextDecoder().decode(bytes);
    } else {
      // Node.js environment
      payload = Buffer.from(base64, "base64").toString("utf8");
    }
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired or will expire within the marginSeconds
 * @param token - The string JWT token to check
 * @param marginSeconds - Number of seconds before actual expiration to consider as expired
 * @returns True if the token is expired or about to expire, false otherwise
 */
export const isTokenExpired = (
  token: string | null,
  marginSeconds = 120
): boolean => {
  const payload: JwtPayload = decodeJwt(token);
  if (!payload || !payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec + marginSeconds;
};
