import { TextArea } from "~/components/TextArea";
import { useSessionDataSync } from "~/hooks/useSessionDataSync";
import { useSessionStore } from "~/stores/useSessionStore";

export function PlayerHeader() {
  const { activeSession, activeViewId } = useSessionDataSync();

  const updateViewLabel = useSessionStore(
    (state) => state.actions.updateViewLabel,
  );

  const currentView = activeSession?.views.find(
    (view) => view.id === activeViewId,
  );

  if (!activeSession || !currentView) {
    return (
      <div className="min-w-0">
        <TextArea
          value=""
          placeholder="Untitled View"
          className="text-title-2! font-semibold text-foreground"
        />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <TextArea
        value={currentView.label}
        onChange={(e) =>
          updateViewLabel(activeSession.id, currentView.id, e.target.value)
        }
        placeholder="Untitled View"
        className="text-title-2! font-semibold text-foreground"
      />
    </div>
  );
}
