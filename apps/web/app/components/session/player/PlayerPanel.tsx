import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
} from "../common/PanelSection";

import { PlayerTimeline } from "./timeline/PlayerTimeline";
import { PlayerHeader } from "./header/PlayerHeader";
import { PlayerViewList } from "./header/PlayerViewList";
import { VideoStage } from "./video/VideoStage";
import { useSessionDataSync } from "~/hooks/useSessionDataSync";

export function PlayerPanel() {
  const { activeSession, activeView, activeViewId, setActiveViewId } =
    useSessionDataSync();

  return (
    <PanelSection className="px-4.5 pt-4.5 gap-y-4.5">
      <PlayerHeader
        sessionId={activeSession?.id ?? null}
        activeView={activeView}
      />

      <PlayerViewList
        views={activeSession?.views ?? []}
        activeViewId={activeViewId}
        onChangeView={setActiveViewId}
        sessionId={activeSession?.id ?? null}
      />

      <PanelSectionBody>
        <PanelScrollArea className="flex flex-col justify-between gap-y-4.5">
          <div className="flex flex-col gap-y-4.5">
            <VideoStage activeView={activeView} />
          </div>

          <PlayerTimeline activeView={activeView} />
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}