/**
 * Configuration constants for the Session pages.
 */

// Default split percentages for the resizable panels: [Sidebar, Player, Analysis]
export const DEFAULT_PANEL_SIZES = [15, 50, 30];

// Toggles available in the ViewPanel overlay
export const VIEW_TOGGLES = [
  { key: "gait", label: "Gait", default: false },
  { key: "posture", label: "Posture", default: true },
  { key: "sway", label: "Sway", default: false },
  { key: "motion", label: "Motion", default: false },
  { key: "points", label: "Points", default: false },
  { key: "smartphone", label: "Smartphone", default: false },
  { key: "gyroscope", label: "Gyroscope", default: false },
  { key: "annotations", label: "Annotations", default: true },
] as const;

export type ViewToggleKey = typeof VIEW_TOGGLES[number]["key"];

// Tabs available in the AnalysisPanel
export const ANALYSIS_TABS = [
  { value: "chapters", label: "Chapters" },
  { value: "points", label: "Points" },
  { value: "annotations", label: "Annotations" },
] as const;

export type AnalysisTabKey = typeof ANALYSIS_TABS[number]["value"];