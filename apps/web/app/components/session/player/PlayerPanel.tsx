import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
} from "../common/PanelSection";

import { PlayerFooter } from "./footer/PlayerFooter";
import { PlayerHeader } from "./header/PlayerHeader";
import { PlayerViewList } from "./header/PlayerViewList";
import { PlayerToolbar } from "./toolbar/PlayerToolbar";
import { VideoStage } from "./video/VideoStage";

export function PlayerPanel() {
  return (
    <PanelSection className="px-4.5 pt-4.5 gap-y-4.5">
      <PlayerHeader />
      <PlayerViewList />

      <PanelSectionBody>
        <PanelScrollArea className="flex flex-col justify-between gap-y-4.5">
          <div className="flex flex-col gap-y-4.5">
            <VideoStage />
            {/* <PlayerToolbar /> */}
          </div>

          <PlayerFooter />
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}
