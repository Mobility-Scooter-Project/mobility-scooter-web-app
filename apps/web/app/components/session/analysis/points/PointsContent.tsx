import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { PointList } from "./PointList";
import {
  selectAllPointsVisible,
  usePointStore,
} from "~/stores/usePointsStore";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
  PanelSectionHeader,
} from "../../common/PanelSection";

/**
 * Tab content for the Points section in the Analysis Panel.
 *
 * Displays a master visibility toggle for all active points and renders
 * the list of individual point rows.
 */
export function PointsContent() {
  const allPointsVisible = usePointStore(selectAllPointsVisible);
  const toggleAllVisibility = usePointStore(
    (state) => state.actions.toggleAllVisibility,
  );

  return (
    <PanelSection>
      <PanelSectionHeader>
        <Button variant="ghost" onClick={toggleAllVisibility}>
          <Icon name={allPointsVisible ? "Eye" : "EyeOff"} />
          <span>{allPointsVisible ? "Hide All Points" : "Show All Points"}</span>
        </Button>
      </PanelSectionHeader>

      <PanelSectionBody>
        <PanelScrollArea className="pb-4.5">
          <PointList />
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}