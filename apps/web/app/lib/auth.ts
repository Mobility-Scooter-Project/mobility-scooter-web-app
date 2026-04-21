import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { redirect } from "react-router";
import { API_BASE_URL } from "~/config/constants";

/**
 * User profile structure returned from GET /api/v1/me
 * Contains all user information including personal details and role
 */
type User = {
  id: string;
  email: string;
  givenName: string;
  surname: string;
  role: "admin" | "user" | "moderator" | null;
  title: string | null;
  phoneNumber: string | null;
  city: string | null;
  unitId: string | null;
};

/**
 * Zustand store type definition for authentication state management
 * Handles access tokens, user data, and authentication flows
 */
type AuthType = {
  // Current JWT access token stored in memory (not localStorage)
  accessToken: string | null;

  // Current user profile data
  user: User | null;

  // Store access token after successful login
  signIn: (accessToken: string) => void;

  // Clear all auth state (logout)
  signOut: () => void;

  // Check if user has valid, non-expired token
  isAuthenticated: () => boolean;

  // Request new access token using refresh token from HttpOnly cookie
  refreshAccessToken: () => Promise<boolean>;

  // Fetch user profile from API using current access token
  fetchUser: () => Promise<User | null>;
};

/**
 * JWT payload structure after decoding access token
 * Used for extracting expiration time and user ID
 */
type JwtPayload =
  | (Record<string, unknown> & {
      userId?: string | null;
      exp?: number | null; // Expiration timestamp in seconds
    })
  | null;

/**
 * Global authentication store using Zustand
 * Manages auth state in memory (access token) and provides auth methods
 *
 * Why in-memory storage?
 * - More secure than localStorage (not accessible via XSS)
 * - Refresh tokens are stored in HttpOnly cookies by the API
 * - Access tokens are short-lived and refreshed automatically
 */
export const userAuthStore = create<AuthType>()((set, get) => ({
  accessToken: null,
  user: null,

  /**
   * Store access token in memory after successful login
   * Does NOT store user yet - call fetchUser() separately
   *
   * @param accessToken - JWT access token from POST /api/v1/auth/email
   */
  signIn: (accessToken) => {
    set({ accessToken });
  },

  /**
   * Clear all authentication state
   * Call this before redirecting to login page
   */
  signOut: () => {
    set({ accessToken: null, user: null });
  },

  /**
   * Check if user is authenticated with a valid, non-expired token
   *
   * @returns true if access token exists and hasn't expired
   */
  isAuthenticated: () => {
    const { accessToken } = get();
    return accessToken !== null && !isTokenExpired(accessToken);
  },

  /**
   * Fetch user profile data from GET /api/v1/me
   * Requires valid access token in Authorization header
   * Automatically stores user data in store on success
   *
   * @returns User object if successful, null if failed
   */
  fetchUser: async () => {
    const { accessToken } = get();

    // Can't fetch user without a token
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      // API returns user object directly (not wrapped in data)
      const user: User = await response.json();
      set({ user });
      return user;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  },

  /**
   * Refresh access token using refresh token stored in HttpOnly cookie
   * POST /api/v1/auth/refresh-token uses cookies automatically
   * Also fetches fresh user data after successful refresh
   *
   * @returns true if refresh successful, false if refresh token invalid/expired
   */
  refreshAccessToken: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include", // Send HttpOnly cookie with refresh token
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        // Refresh token expired or invalid - clear auth state
        set({ accessToken: null, user: null });
        return false;
      }

      const data = await response.json();
      set({ accessToken: data.token });

      // Fetch updated user profile with new token
      await get().fetchUser();
      return true;
    } catch (error) {
      // Network error or server down
      set({ accessToken: null, user: null });
      return false;
    }
  },
}));

/**
 * Check if a JWT access token is expired or will expire soon
 * Adds a safety margin to refresh tokens before they actually expire
 *
 * @param token - JWT access token to check
 * @param marginSeconds - Seconds before expiration to consider "expired" (default: 120)
 * @returns true if token is null, malformed, or expired/expiring soon
 */
export const isTokenExpired = (
  token: string | null,
  marginSeconds = 120,
): boolean => {
  if (!token) return true;

  try {
    const payload: JwtPayload = jwtDecode(token);

    // Token is malformed or missing expiration
    if (!payload || !payload?.exp) return true;

    const nowSec = Math.floor(Date.now() / 1000);

    // Token expires within the safety margin
    return payload.exp <= nowSec + marginSeconds;
  } catch {
    // jwtDecode threw an error - token is invalid
    return true;
  }
};

/**
 * Route loader middleware to enforce authentication
 * Use this in AppLayout or any protected routes
 *
 * Flow:
 * 1. Check if user has valid access token
 * 2. If not, try to refresh using refresh token
 * 3. If refresh fails, redirect to /login
 * 4. Ensure user data is loaded
 *
 * @param request - Request object from route loader
 * @throws redirect("/login") if authentication fails
 */
export async function requireAuthLoader({ request }: { request: Request }) {
  const { isAuthenticated, refreshAccessToken, fetchUser } =
    userAuthStore.getState();

  // Check if current access token is valid
  if (!isAuthenticated()) {
    // Try to get new access token using refresh token
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      // Refresh token expired - user must login again
      throw redirect("/login");
    }
  }

  // Ensure user profile is loaded (in case page was refreshed)
  const { user } = userAuthStore.getState();
  if (!user) {
    await fetchUser();
  }

  return null;
}

/**
 * Route loader middleware to prevent authenticated users from accessing public pages
 * Use this in AuthLayout (login, signup, forgot-password, etc.)
 *
 * Flow:
 * 1. Check if user is already authenticated
 * 2. If yes, redirect to home (/)
 * 3. If no, try to refresh token to check for valid session
 * 4. If refresh succeeds, user has valid session - redirect to home
 * 5. Otherwise, allow access to public auth pages
 *
 * @param request - Request object from route loader
 * @throws redirect("/") if user is already authenticated
 */
export async function publicOnlyLoader({ request }: { request: Request }) {
  const { isAuthenticated, refreshAccessToken } = userAuthStore.getState();

  // User already has valid access token
  if (isAuthenticated()) {
    throw redirect("/");
  }

  // Try to refresh - user might have valid refresh token
  const refreshed = await refreshAccessToken();
  if (refreshed) {
    // User has valid session - don't show login page
    throw redirect("/");
  }

  // User is not authenticated - allow access to auth pages
  return null;
}
