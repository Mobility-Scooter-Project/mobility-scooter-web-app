import Placeholder from "~/assets/placeholder-thumbnail.png";

/* ---------------- Types ---------------- */

export type PointStatus = "visible" | "hidden" | "available";

export type Point = {
  id: number;
  name: string;
  status: PointStatus;
};

export type Chapter = {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: string;
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

export type View = {
  id: string;
  label: string;
  videoUrl: string;
  chapters: Chapter[];
  points: Point[];
  annotations: Annotation[];
};

export type Session = {
  id: number;
  date: string;
  notification: boolean;
  views: View[];
};

/* ---------------- Helpers ---------------- */

// Helper to generate a standard set of body points
function generatePoints(variation: "standard" | "injured" | "mixed"): Point[] {
  const basePoints: Point[] = [
    { id: 1, name: "Nose", status: "visible" },
    { id: 2, name: "Left Shoulder", status: "visible" },
    { id: 3, name: "Right Shoulder", status: "visible" },
    { id: 4, name: "Left Elbow", status: "visible" },
    { id: 5, name: "Right Elbow", status: "visible" },
    { id: 6, name: "Left Hip", status: "visible" },
    { id: 7, name: "Right Hip", status: "visible" },
  ];

  if (variation === "injured") {
    return basePoints.map((p) =>
      p.name.includes("Right") ? { ...p, status: "hidden" } : p
    );
  }
  if (variation === "mixed") {
    return basePoints.map((p, i) =>
      i % 2 === 0 ? { ...p, status: "available" } : p
    );
  }
  return basePoints;
}

const VIDEO_1 = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
const VIDEO_2 = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

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
        videoUrl: VIDEO_1,
        points: generatePoints("standard"),
        chapters: [],
        annotations: [],
      },
    ],
  },

  // --- Session 2 ---
  {
    id: 2,
    date: "08/05/2025",
    notification: false,
    views: [
      {
        id: "v1",
        label: "Front View",
        videoUrl: VIDEO_1,
        points: generatePoints("standard"),
        chapters: [
          {
            id: 301,
            thumbnailUrl: Placeholder,
            title: "Routine Checkup",
            timestamp: "00:00",
            author: "Garrett Lo",
            lastUpdated: "Aug 05",
            score: 5,
            description: "Patient is fully recovered.",
          },
        ],
        annotations: [],
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
        videoUrl: VIDEO_1,
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
            timestamp: "00:00",
            author: "Dr. Smith",
            lastUpdated: "Last Updated Sep 10",
            score: 2,
            description: "Right side visibility is poor due to lighting.",
          },
        ],
        annotations: [],
      },
    ],
  },

  // --- Session 5 (Multiple Views) ---
  {
    id: 5,
    date: "09/16/2025",
    notification: true,
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
            timestamp: "00:00",
            author: "Garrett Lo",
            lastUpdated: "Sep 25",
            score: 4,
            description: "Strong baseline performance.",
          },
          {
            id: 2,
            thumbnailUrl: Placeholder,
            title: "The Breakdown",
            timestamp: "01:30",
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
      },
      {
        id: "v2",
        label: "Wide Angle",
        videoUrl: VIDEO_2,
        points: generatePoints("injured"), // Different points for this view
        chapters: [
          {
            id: 10,
            thumbnailUrl: Placeholder,
            title: "Wide Angle Start",
            timestamp: "00:00",
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
      },
    ],
  },
];