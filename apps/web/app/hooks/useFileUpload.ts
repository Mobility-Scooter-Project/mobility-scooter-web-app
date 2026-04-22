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

type ItemUpdater = Item[] | ((items: Item[]) => Item[]);

interface UseFileUploadOptions {
  isMulti: boolean;
  items?: Item[];
  onItemsChange?: (items: Item[]) => void;
  cleanupPreviewUrlsOnUnmount?: boolean;
}

function resolveItemsUpdate(current: Item[], updater: ItemUpdater) {
  return typeof updater === "function" ? updater(current) : updater;
}

export function useFileUpload({
  isMulti,
  items: controlledItems,
  onItemsChange,
  cleanupPreviewUrlsOnUnmount = true,
}: UseFileUploadOptions) {
  const [uncontrolledItems, setUncontrolledItems] = React.useState<Item[]>([]);
  const isControlled = controlledItems !== undefined;
  const items = isControlled ? controlledItems : uncontrolledItems;
  const itemsRef = React.useRef(items);
  const previousItemsRef = React.useRef(items);

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  React.useEffect(() => {
    if (!isControlled) {
      previousItemsRef.current = items;
      return;
    }

    const nextIds = new Set(items.map((item) => item.id));

    for (const previousItem of previousItemsRef.current) {
      if (!nextIds.has(previousItem.id) && previousItem.timer) {
        window.clearInterval(previousItem.timer);
      }
    }

    previousItemsRef.current = items;
  }, [isControlled, items]);

  const cleanupItem = React.useCallback((item: Item, revokePreviewUrl = true) => {
    if (item.timer) window.clearInterval(item.timer);
    if (revokePreviewUrl && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  const updateItems = React.useCallback(
    (updater: ItemUpdater) => {
      const next = resolveItemsUpdate(itemsRef.current, updater);

      if (!isControlled) {
        setUncontrolledItems(next);
      }

      onItemsChange?.(next);
    },
    [isControlled, onItemsChange],
  );

  const startUploadSimulation = React.useCallback(
    (itemId: string) => {
      updateItems((previous) => {
        const index = previous.findIndex((item) => item.id === itemId);
        if (index === -1) return previous;

        const next = [...previous];
        const speed = 4 + Math.random() * 6;
        const tickMs = 120;

        const timer = window.setInterval(() => {
          updateItems((state) => {
            const itemIndex = state.findIndex((item) => item.id === itemId);
            if (itemIndex === -1) {
              clearInterval(timer);
              return state;
            }

            const current = state[itemIndex];
            if (current.status === "done") {
              clearInterval(timer);
              return state;
            }

            const nextProgress = Math.min(100, current.progress + speed);
            const updated = { ...current, progress: nextProgress };
            const updatedItems = [...state];
            updatedItems[itemIndex] = updated;

            if (nextProgress >= 100) {
              clearInterval(timer);
              (async () => {
                const [duration, natural] = await Promise.all([
                  probeDuration(current.file).catch(() => undefined),
                  getNaturalDims(current.file, current.previewUrl || ""),
                ]);

                updateItems((finalItems) => {
                  const finalIndex = finalItems.findIndex(
                    (item) => item.id === itemId,
                  );
                  if (finalIndex === -1) return finalItems;

                  const finalNext = [...finalItems];
                  finalNext[finalIndex] = {
                    ...finalItems[finalIndex],
                    status: "done",
                    progress: 100,
                    durationSec: duration,
                    natural,
                    timer: null,
                  };
                  return finalNext;
                });
              })();
            }

            return updatedItems;
          });
        }, tickMs);

        next[index] = { ...next[index], timer };
        return next;
      });
    },
    [updateItems],
  );

  const addItems = React.useCallback(
    (newItems: Item[]) => {
      if (!isMulti) {
        itemsRef.current.forEach((item) => cleanupItem(item));
      }

      updateItems((previous) => {
        if (!isMulti) {
          return newItems;
        }

        return [...newItems, ...previous];
      });

      requestAnimationFrame(() => {
        newItems.forEach((item) => startUploadSimulation(item.id));
      });
    },
    [cleanupItem, isMulti, startUploadSimulation, updateItems],
  );

  const removeItem = React.useCallback(
    (id: string) => {
      updateItems((previous) => {
        const removed = previous.find((item) => item.id === id);
        if (removed) {
          cleanupItem(removed);
        }

        return previous.filter((item) => item.id !== id);
      });
    },
    [cleanupItem, updateItems],
  );

  React.useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) =>
        cleanupItem(item, cleanupPreviewUrlsOnUnmount),
      );
    };
  }, [cleanupItem, cleanupPreviewUrlsOnUnmount]);

  return { items, addItems, removeItem };
}
