import { create } from "zustand";

interface VideoStore {
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  actions: {
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
  };
}

export const useVideoStore = create<VideoStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  actions: {
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setDuration: (duration) => set({ duration }),
  },
}));