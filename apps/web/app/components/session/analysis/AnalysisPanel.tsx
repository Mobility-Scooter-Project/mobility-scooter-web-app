import { Tabs, TabsContent } from "~/components/ui/tabs";
import { PanelNav } from "~/components/session/analysis/PanelNav";

const panelTabs = [
  { value: "analysis", label: "Analysis" },
  { value: "chapters", label: "Chapters" },
  { value: "points", label: "Points" },
  { value: "annotations", label: "Annotations" },
  { value: "comments", label: "Comments" },
  { value: "logs", label: "Audit Logs" },
];

export function AnalysisPanel() {
  return (
    <Tabs defaultValue="analysis" className="flex flex-col h-full p-2 gap-2">
      <PanelNav tabs={panelTabs} />

      {panelTabs.map((tab) => (
        <TabsContent key={`${tab.value}-content`} value={tab.value}>
          <div className="">{tab.label} content</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
