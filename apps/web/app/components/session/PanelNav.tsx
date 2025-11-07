import { TabsList, TabsTrigger } from "~/components/Tabs";

type PanelTab = {
  value: string;
  label: string;
};

interface PanelNavProps {
  tabs: PanelTab[];
}

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
