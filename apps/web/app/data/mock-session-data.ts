import Placeholder from "~/assets/placeholder-thumbnail.png";

/* ---------------- Types ---------------- */

export type PointStatus = "visible" | "hidden" | "inactive";

export type Point = {
  id: number;
  name: string;
  status: PointStatus;
};

export type Chapter = {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: number;
  author: string;
  lastUpdated: string;
  score: number | null;
  description: string;
};

export type Annotation = {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  author: string;
  date: string;
  description: string;
};

export type RiskSeverity = "warning" | "danger";

export type Risk = {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  severity: RiskSeverity;
  source: "model";
  description?: string;
};

export type View = {
  id: string;
  label: string;
  videoUrl: string;
  chapters: Chapter[];
  points: Point[];
  annotations: Annotation[];
  risks: Risk[];
  framesUrl?: string;
};

export type Session = {
  id: number;
  patientId?: string;
  date: string;
  notification: boolean;
  views: View[];
};

/* ---------------- Helpers ---------------- */

/**
 * Generates mock point data for a session view, matching the YOLO CSV output.
 */
function generatePoints(variation: "standard" | "injured" | "mixed"): Point[] {
  const basePoints: Point[] = [
    { id: 1, name: "Nose", status: "visible" },
    { id: 2, name: "Left Shoulder", status: "visible" },
    { id: 3, name: "Right Shoulder", status: "visible" },
    { id: 4, name: "Midpoint Shoulder", status: "visible" },
    { id: 5, name: "Left Elbow", status: "visible" },
    { id: 6, name: "Right Elbow", status: "visible" },
    { id: 7, name: "Left Wrist", status: "visible" },
    { id: 8, name: "Right Wrist", status: "visible" },
    { id: 9, name: "Left Hip", status: "visible" },
    { id: 10, name: "Right Hip", status: "visible" },
    { id: 11, name: "Midpoint Hip", status: "visible" },
  ];

  if (variation === "injured") {
    return basePoints.map((point) =>
      point.name.includes("Right")
        ? { ...point, status: "hidden" }
        : point,
    );
  }

  if (variation === "mixed") {
    return basePoints.map((p, i) =>
      i % 2 === 0 ? { ...p, status: "inactive" } : p,
    );
  }

  return basePoints;
}

// Updated video sources
const VIDEO_1 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
const VIDEO_2 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
const VIDEO_3 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const VIDEO_4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

/* ---------------- Mock Data ---------------- */

export const MOCK_SESSIONS: Session[] = [
  // --- Session 1 ---
  {
    id: 1,
    date: "08/01/2025",
    notification: false,
    views: [
      {
        id: "v1",
        label: "Front View",
        videoUrl: VIDEO_3,
        points: generatePoints("standard"),
        chapters: [],
        annotations: [],
        risks: [],
      },
    ],
  },

  // --- Session 2 ---
  {
    id: 2,
    date: "08/05/2025",
    notification: true,
    views: [
      {
        id: "v1",
        label: "Front View",
        videoUrl: VIDEO_4,
        points: generatePoints("standard"),
        chapters: [
          {
            id: 301,
            thumbnailUrl: Placeholder,
            title: "Routine Checkup",
            timestamp: 0,
            author: "Garrett Lo",
            lastUpdated: "Aug 05",
            score: 5,
            description: "Patient is fully recovered.",
          },
        ],
        annotations: [],
        risks: [
          {
            id: 9001,
            title: "Knee valgus detected",
            startTime: 18,
            endTime: 24,
            severity: "warning",
            source: "model",
            description: "Model detected moderate instability during stride.",
          },
        ],
      },
    ],
  },

  // --- Session 3 ---
  {
    id: 3,
    date: "09/24/2025",
    notification: false,
    views: [
      {
        id: "v1",
        label: "Side Angle",
        videoUrl: VIDEO_2,
        points: generatePoints("mixed"),
        chapters: [],
        annotations: [
          {
            id: 201,
            title: "Equipment Check",
            startTime: 5,
            endTime: 15,
            author: "Admin",
            date: "Sep 24",
            description: "Calibration needed.",
          },
        ],
        risks: [
          {
            id: 9002,
            title: "Reduced arm swing",
            startTime: 31,
            endTime: 38,
            severity: "warning",
            source: "model",
          },
          {
            id: 9003,
            title: "Trunk lean spike",
            startTime: 42,
            endTime: 46,
            severity: "danger",
            source: "model",
          },
        ],
      },
    ],
  },

  // --- Session 4 ---
  {
    id: 4,
    date: "09/10/2025",
    notification: true,
    views: [
      {
        id: "v1",
        label: "Main Camera",
        videoUrl: VIDEO_1,
        points: generatePoints("injured"),
        chapters: [
          {
            id: 101,
            thumbnailUrl: Placeholder,
            title: "Injury Assessment",
            timestamp: 0,
            author: "Dr. Smith",
            lastUpdated: "Last Updated Sep 10",
            score: 2,
            description: "Right side visibility is poor due to lighting.",
          },
        ],
        annotations: [],
        risks: [
          {
            id: 9004,
            title: "Low confidence posture segment",
            startTime: 8,
            endTime: 14,
            severity: "warning",
            source: "model",
          },
        ],
      },
    ],
  },

  // --- Session 5 (Multiple Views) ---
  {
    id: 5,
    date: "09/16/2025",
    notification: false,
    views: [
      {
        id: "v1",
        label: "Sick Epic POV",
        videoUrl: VIDEO_1,
        points: generatePoints("standard"),
        chapters: [
          {
            id: 1,
            thumbnailUrl: Placeholder,
            title: "Spinning that Whip (POV)",
            timestamp: 0,
            author: "Garrett Lo",
            lastUpdated: "Sep 25",
            score: 4,
            description: "Strong baseline performance.",
          },
          {
            id: 2,
            thumbnailUrl: Placeholder,
            title: "The Breakdown",
            timestamp: 90,
            author: "Garrett Lo",
            lastUpdated: "Sep 26",
            score: null,
            description: "",
          },
        ],
        annotations: [
          {
            id: 1,
            title: "Initial Gait Analysis",
            startTime: 0,
            endTime: 10,
            author: "Garrett Lo",
            date: "Sep 25",
            description: "Patient shows slight limp on left side.",
          },
        ],
        risks: [
          {
            id: 9005,
            title: "Asymmetrical loading",
            startTime: 12,
            endTime: 19,
            severity: "danger",
            source: "model",
          },
        ],
      },
      {
        id: "v2",
        label: "Wide Angle",
        videoUrl: VIDEO_2,
        points: generatePoints("injured"),
        chapters: [
          {
            id: 10,
            thumbnailUrl: Placeholder,
            title: "Wide Angle Start",
            timestamp: 0,
            author: "Garrett Lo",
            lastUpdated: "Sep 25",
            score: 3,
            description: "Wide angle perspective of the same session.",
          },
        ],
        annotations: [
          {
            id: 50,
            title: "Background Risk",
            startTime: 20,
            endTime: 40,
            author: "Safety Officer",
            date: "Sep 25",
            description: "Obstruction observed in background.",
          },
        ],
        risks: [
          {
            id: 9006,
            title: "Occlusion event",
            startTime: 20,
            endTime: 28,
            severity: "warning",
            source: "model",
          },
          {
            id: 9007,
            title: "Instability window",
            startTime: 60,
            endTime: 90,
            severity: "danger",
            source: "model",
          },
        ],
      },
    ],
  },
  {
    id: 6,
    date: "10/25/2025",
    notification: true,
    views: [
      {
        id: "v1",
        label: "AI Overlay Test",
        videoUrl: "/videos/test-video.mp4",
        points: generatePoints("standard"),
        chapters: [],
        annotations: [],
        risks: [],
        framesUrl: "/data/videos_keypoint.csv",
      },
    ],
  },
];
