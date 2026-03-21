import { TabsList, TabsTrigger } from "~/components/Tabs";

export type PanelTabItem = {
  value: string;
  label: string;
};

interface PanelNavProps {
  tabs: readonly PanelTabItem[];
}

/**
 * A navigational header for session panels (Analysis, etc.).
 */
export function PanelNav({ tabs }: PanelNavProps) {
  return (
    <TabsList className="flex flex-wrap h-auto justify-start gap-2 rounded-none">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="text-label h-9"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}