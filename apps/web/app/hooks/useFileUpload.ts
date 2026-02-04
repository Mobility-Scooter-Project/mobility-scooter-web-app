import * as React from "react";
import { probeDuration, getNaturalDims } from "~/lib/media";

export type Item = {
  id: string;
  file: File;
  status: "uploading" | "done";
  progress: number;
  previewUrl?: string;
  durationSec?: number;
  natural?: { w: number; h: number };
  timer?: number | null;
};

export function useFileUpload(isMulti: boolean) {
  const [items, setItems] = React.useState<Item[]>([]);

  const cleanupItem = React.useCallback((i: Item) => {
    if (i.timer) window.clearInterval(i.timer);
    // Important: Prevents memory leaks by releasing the reference to the file in browser memory
    if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
  }, []);

  const startUploadSimulation = React.useCallback((itemId: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;

      const copy = [...prev];
      const speed = 4 + Math.random() * 6;
      const tickMs = 120;

      const timer = window.setInterval(() => {
        setItems((state) => {
          const i = state.findIndex((x) => x.id === itemId);
          if (i === -1) {
            clearInterval(timer);
            return state;
          }

          const cur = state[i];
          if (cur.status === "done") {
            clearInterval(timer);
            return state;
          }

          const nextProg = Math.min(100, cur.progress + speed);
          const updated = { ...cur, progress: nextProg };
          const next = [...state];
          next[i] = updated;

          if (nextProg >= 100) {
            clearInterval(timer);
            (async () => {
              // Concurrency: Probing both duration and dimensions simultaneously
              const [duration, nat] = await Promise.all([
                probeDuration(cur.file).catch(() => undefined),
                getNaturalDims(cur.file, cur.previewUrl || ""),
              ]);

              setItems((fin) => {
                const j = fin.findIndex((x) => x.id === itemId);
                if (j === -1) return fin;
                const arr = [...fin];
                arr[j] = {
                  ...fin[j],
                  status: "done",
                  progress: 100,
                  durationSec: duration,
                  natural: nat,
                  timer: null,
                };
                return arr;
              });
            })();
          }
          return next;
        });
      }, tickMs);

      copy[idx] = { ...copy[idx], timer };
      return copy;
    });
  }, []);

  const addItems = React.useCallback(
    (newItems: Item[]) => {
      setItems((prev) => {
        if (!isMulti) {
          prev.forEach(cleanupItem);
          return newItems;
        }
        return [...newItems, ...prev];
      });

      // Ensure the state update is flushed to the DOM before starting intervals
      requestAnimationFrame(() => {
        newItems.forEach((item) => startUploadSimulation(item.id));
      });
    },
    [isMulti, cleanupItem, startUploadSimulation],
  );

  const removeItem = React.useCallback(
    (rid: string) => {
      setItems((prev) => {
        const toRemove = prev.find((i) => i.id === rid);
        if (toRemove) cleanupItem(toRemove);
        return prev.filter((i) => i.id !== rid);
      });
    },
    [cleanupItem],
  );

  React.useEffect(() => {
    return () =>
      setItems((prev) => {
        prev.forEach(cleanupItem);
        return [];
      });
  }, [cleanupItem]);

  return { items, addItems, removeItem };
}
