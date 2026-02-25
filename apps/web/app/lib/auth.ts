import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { redirect } from "react-router";
import { API_BASE_URL } from "~/config/constants";

// types
type AuthType = {
  accessToken: string | null;
  signIn: (accessToken: string) => void;
  signOut: () => void;
  isAuthenticated: () => boolean;
  refreshAccessToken: () => Promise<boolean>;
};
type JwtPayload =
  | (Record<string, unknown> & {
      userId?: string | null;
      exp?: number | null;
    })
  | null;

// Zustand store
export const userAuthStore = create<AuthType>()((set, get) => ({
  accessToken: null, // Stored in JS memory, which will be lost on refresh for security benefit

  // Store access token in memory
  signIn: (accessToken) => {
    set({ accessToken });
  },

  // remove access token from memory
  signOut: () => {
    set({ accessToken: null });
  },

  // Check if user is authenticated by verifying access token validity
  isAuthenticated: () => {
    const { accessToken } = get();
    return accessToken !== null && !isTokenExpired(accessToken);
  },

  // Refresh access token using refresh token in HttpOnly cookie
  // session management logic
  refreshAccessToken: async () => {
    try {
      // Attempt to refresh access token by calling API endpoint that uses HttpOnly cookie
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      // If refresh fails (e.g. invalid/expired refresh token), clear access token and return false
      if (!response.ok) {
        set({ accessToken: null });
        return false;
      }

      // On success, update access token in memory
      const { data } = await response.json();
      set({ accessToken: data.token });
      return true;
    } catch (error) {
      // On error (e.g. network issues), clear access token and return false
      set({ accessToken: null });
      return false;
    }
  },
}));

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

// loader to enforce authentication at route level
export async function requireAuthLoader({ request }: { request: Request }) {
  const { isAuthenticated, refreshAccessToken } = userAuthStore.getState();

  if (!isAuthenticated()) {
    // Try to refresh the token first
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      // Redirect to login if refresh fails
      throw redirect("/login");
    }
  }

  return null;
}
