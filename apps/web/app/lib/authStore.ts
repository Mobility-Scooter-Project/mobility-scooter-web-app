import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
};
export const userAuthStore = create<AuthType>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearAccessToken: () => set({ accessToken: null }),
    }),
    {
      name: "auth-storage", // key name to be saved in localStorage
    }
  )
);
