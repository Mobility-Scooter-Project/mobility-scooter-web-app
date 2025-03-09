import { pgEnum, pgSchema, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const videos = pgSchema("videos");

export const metadata = videos.table("metadata", {
    id: uuid().primaryKey(),
    // patientId: uuid().references(patients),
    filename: varchar({ length: 255 }).notNull(),
    url: text().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});

export const video_status = pgEnum("video_status", ["pending", "processing", "processed", "failed"]);

export const status = videos.table("status", {
    id: uuid().primaryKey(),
    video_id: uuid().references(() => metadata.id).notNull(),
    status: video_status().notNull().default("pending"),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});