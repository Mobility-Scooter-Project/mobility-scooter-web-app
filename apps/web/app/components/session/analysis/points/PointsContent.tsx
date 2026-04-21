import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { PointList } from "./PointList";
import {
  selectAllPointsVisible,
  usePointStore,
} from "~/stores/usePointsStore";
import { useKeypointStore } from "~/stores/useKeypointStore";
import { selectActiveView, useSessionStore } from "~/stores/useSessionStore";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
  PanelSectionHeader,
} from "../../common/PanelSection";
import { ProcessingNotice } from "../../common/ProcessingNotice";
/**
 * Tab content for the Points section in the Analysis Panel.
 *
 * Displays a master visibility toggle for all active points and renders
 * the list of individual point rows.
 */
export function PointsContent() {
  const allPointsVisible = usePointStore(selectAllPointsVisible);
  const points = usePointStore((state) => state.points);
  const toggleAllVisibility = usePointStore(
    (state) => state.actions.toggleAllVisibility,
  );
  const poseStatus = useKeypointStore((state) => state.poseStatus);
  const activeView = useSessionStore(selectActiveView);

  const showProcessingHint =
    Boolean(activeView?.videoId) &&
    !activeView?.uploading &&
    points.length > 0 &&
    (poseStatus === "pending" || poseStatus === "processing");

  return (
    <PanelSection>
      <PanelSectionHeader>
        <Button variant="ghost" onClick={toggleAllVisibility}>
          <Icon name={allPointsVisible ? "Eye" : "EyeOff"} />
          <span>{allPointsVisible ? "Hide All Points" : "Show All Points"}</span>
        </Button>
      </PanelSectionHeader>

      <PanelSectionBody>
        <PanelScrollArea>
          <div className="flex flex-col gap-3">
            {showProcessingHint ? (
              <ProcessingNotice>Overlay data is still updating.</ProcessingNotice>
            ) : null}
            <PointList />
          </div>
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}
