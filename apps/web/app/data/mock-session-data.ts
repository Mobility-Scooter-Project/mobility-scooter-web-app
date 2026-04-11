/* ---------------- Types ---------------- */

export type PointStatus = "visible" | "hidden" | "inactive";

export type Point = {
  id: string;
  name: string;
  status: PointStatus;
};

export type Chapter = {
  id: string;
  thumbnailUrl: string;
  title: string;
  timestamp: number;
  author: string;
  lastUpdated: string;
  score: number | null;
  description: string;
};

export type Annotation = {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  author: string;
  date: string;
  description: string;
};

export type RiskSeverity = "warning" | "danger";

export type Risk = {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  severity: RiskSeverity;
  source: "model";
  description?: string;
};

export type View = {
  id: string;
  /** Backend video record UUID, used to fetch presigned playback URLs. */
  videoId?: string;
  label: string;
  videoUrl: string;
  chapters: Chapter[];
  points: Point[];
  annotations: Annotation[];
  risks: Risk[];
  framesUrl?: string;
  /** True while the video file is still being uploaded to the API. */
  uploading?: boolean;
  /** True when the video upload or processing failed. */
  uploadError?: boolean;
};

export type Session = {
  id: string;
  patientUuid?: string;
  date: string;
  notification: boolean;
  views: View[];
};
