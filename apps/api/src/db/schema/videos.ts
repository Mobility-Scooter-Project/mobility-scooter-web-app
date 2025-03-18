import { pgEnum, pgSchema, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const videos = pgSchema("videos");

export const videoMetadata = videos.table("metadata", {
    id: uuid().primaryKey().defaultRandom(),
    patientId: uuid().notNull(), // TODO: add foreign key constraint once we know more about the patients table
    filename: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});

export const video_status = pgEnum("video_status", ["pending", "processing", "processed", "failed"]);

export const status = videos.table("status", {
    id: uuid().primaryKey().defaultRandom(),
    video_id: uuid().references(() => videoMetadata.id).notNull(),
    status: video_status().notNull().default("pending"),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});