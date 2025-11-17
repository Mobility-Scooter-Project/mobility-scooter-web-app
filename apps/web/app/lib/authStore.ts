import { create } from "zustand";
import { persist } from "zustand/middleware";

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
