import { uuid } from "drizzle-orm/pg-core/columns/uuid";
import { videos } from "./schema";
import { timestamp } from "drizzle-orm/pg-core/columns/timestamp";
import { metadata } from "./metadata";
import { pgEnum } from "drizzle-orm/pg-core";

export const video_status = pgEnum("video_status", ["pending", "processing", "processed", "failed"]);

export const status = videos.table("status", {
    id: uuid().primaryKey(),
    video_id: uuid().references(() => metadata.id).notNull(),
    status: video_status().notNull().default("pending"),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});