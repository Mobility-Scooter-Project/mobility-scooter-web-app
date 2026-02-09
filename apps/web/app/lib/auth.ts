import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { redirect } from "react-router";

// types
type AuthType = {
  accessToken: string | null;
  refreshToken: string | null;
  signIn: (accessToken: string, refreshToken?: string) => void;
  signOut: () => void;
  isAuthenticated: () => boolean;
};
type JwtPayload =
  | (Record<string, unknown> & {
      userId?: string | null;
      exp?: number | null;
    })
  | null;

// Zustand local storage to manage user authentication tokens
export const userAuthStore = create<AuthType>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      signIn: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken: refreshToken || null }),
      signOut: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => {
        const { accessToken } = get();
        return accessToken !== null && !isTokenExpired(accessToken);
      },
    }),
    {
      name: "auth-storage", // key name to be saved in localStorage
    },
  ),
);

/**
 * Check if JWT token is expired or will expire within the marginSeconds
 * @param token - The string JWT token to check
 * @param marginSeconds - Number of seconds before actual expiration to consider as expired
 * @returns True if the token is expired or about to expire, false otherwise
 */
export const isTokenExpired = (
  token: string | null,
  marginSeconds = 120,
): boolean => {
  if (!token) return true;
  const payload: JwtPayload = jwtDecode(token);
  if (!payload || !payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec + marginSeconds;
};

// helper function to refresh access token using the backend API
export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const response = await fetch("/api/auth/refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  return data.token; // Assuming the backend returns { token: "new-access-token" }
}

// loader to enforce authentication at route level
export async function requireAuthLoader() {
  const state = userAuthStore.getState();

  if (state.isAuthenticated()) return null;

  if (state.refreshToken) {
    try {
      const newAccessToken = await refreshAccessToken(state.refreshToken);
      state.signIn(newAccessToken, state.refreshToken);
      return null;
    } catch {
      state.signOut();
      throw redirect("/login");
    }
  }

  state.signOut();
  throw redirect("/login");
}
