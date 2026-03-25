import { useSelectionStore } from "~/stores/useSelectionStore";

export function useAnnotationSelection() {
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedType = useSelectionStore((state) => state.selectedType);
  const selectSelection = useSelectionStore(
    (state) => state.actions.selectSelection,
  );
  const clearSelection = useSelectionStore((state) => state.actions.clearSelection);

  return {
    selectedAnnotationId: selectedType === "annotation" ? selectedId : null,
    selectAnnotation: (id: number) => selectSelection("annotation", id),
    clearAnnotationSelection: clearSelection,
    isAnnotationSelected: (id: number) =>
      selectedType === "annotation" && selectedId === id,
  };
}