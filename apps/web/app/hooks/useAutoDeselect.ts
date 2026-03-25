import { useEffect, type RefObject } from "react";

/**
 * Hook to handle "click outside" behavior for selection states.
 *
 * @param ref - The element reference to detect clicks inside.
 * @param isSelected - Boolean flag indicating if the item is currently selected.
 * @param onDeselect - Callback function to run when a click occurs outside.
 */
export function useAutoDeselect(
  ref: RefObject<HTMLElement | null>,
  isSelected: boolean,
  onDeselect: () => void
) {
  useEffect(() => {
    if (!isSelected) return;

    const onDocClick = (e: MouseEvent) => {
      const el = ref.current;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (el && el.contains(target)) return;
      if (target.closest("[data-radix-portal]")) return;

      onDeselect();
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isSelected, onDeselect, ref]);
}