import {
  pgEnum,
  pgSchema,
  timestamp,
  uuid,
  varchar,
  json,
  real,
  integer,
} from "drizzle-orm/pg-core";

export const storage = pgSchema("storage");
export const videoStatus = pgEnum("video_status", [
  "pending",
  "processing",
  "processed",
  "failed",
  "annotation approved",
  "annotation created"
]);

export const fileMetadata = storage.table("metadata", {
  id: uuid().primaryKey().defaultRandom(),
  patientId: varchar({ length: 30 }).notNull(), // TODO: add foreign key constraint once we know more about the patients table
  statusEventId: uuid()
    .references(() => events.id)
    .notNull(),
  path: varchar({ length: 255 }).notNull(),
  uploadedAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),

});

export const events = storage.table("events", {
  id: uuid().primaryKey().defaultRandom(),
  status: videoStatus().notNull().default("pending"),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const tasks = storage.table("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  videoId: uuid()
    .references(() => fileMetadata.id)
    .notNull(),
  taskId: integer("task_id").notNull().default(1), // number ID
  task: json("task").notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})

export const keyPoints = storage.table("keypoints", {
  id: uuid().primaryKey().defaultRandom(),
  videoId: uuid()
    .references(() => fileMetadata.id)
    .notNull(),
  timestamp: varchar({ length: 30 }).notNull(),
  angle: real(),
  keypoints: json("keypoints").notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})