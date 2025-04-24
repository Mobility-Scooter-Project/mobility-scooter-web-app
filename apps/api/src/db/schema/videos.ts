import {
  pgEnum,
  pgSchema,
  timestamp,
  uuid,
  varchar,
  text,
  json,
  real,
} from "drizzle-orm/pg-core";

export const videos = pgSchema("videos");
export const videoStatus = pgEnum("video_status", [
  "pending",
  "processing",
  "processed",
  "failed",
  "annotation approved",
  "annotation created"
]);

export const videoMetadata = videos.table("metadata", {
  id: uuid().primaryKey().defaultRandom(),
  patientId: varchar({ length: 30 }).notNull(), // TODO: add foreign key constraint once we know more about the patients table
  eventId: uuid()
    .references(() => videoEvents.id)
    .notNull(),
  path: varchar({ length: 255 }).notNull(),
  date: timestamp(),
});

export const videoEvents = videos.table("events", {
  id: uuid().primaryKey().defaultRandom(),
  status: videoStatus().notNull().default("pending"),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const videoTasks = videos.table("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  videoId: uuid()
    .references(() => videoMetadata.id)
    .notNull(),
  tasks: json("tasks").notNull(),
})

export const videoKeyPoints = videos.table("keypoints", {
  id: uuid().primaryKey().defaultRandom(),
  videoId: uuid()
    .references(() => videoMetadata.id)
    .notNull(),
  timestamp: varchar({ length: 30 }).notNull(),
  angle: real(),
  keypoints: json("keypoints").notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})

export const videoTranscripts = videos.table("transcripts", {
  id: uuid().primaryKey().defaultRandom(),
  videoId: uuid()
    .references(() => videoMetadata.id)
    .notNull(),
  path: text().notNull(),
  createdAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})
