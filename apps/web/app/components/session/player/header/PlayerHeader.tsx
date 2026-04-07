import { TextArea } from "~/components/TextArea";
import { useSessionStore } from "~/stores/useSessionStore";
import type { View } from "~/data/mock-session-data";

interface PlayerHeaderProps {
  sessionId: number | null;
  activeView: View | null;
}

export function PlayerHeader({ sessionId, activeView }: PlayerHeaderProps) {
  const updateViewLabel = useSessionStore(
    (state) => state.actions.updateViewLabel,
  );

  return (
    <div className="min-w-0">
      <TextArea
        value={activeView?.label ?? ""}
        onChange={
          sessionId && activeView
            ? (e) => updateViewLabel(sessionId, activeView.id, e.target.value)
            : undefined
        }
        placeholder="Untitled View"
        className="text-title-2! font-semibold text-foreground"
      />
    </div>
  );
}
