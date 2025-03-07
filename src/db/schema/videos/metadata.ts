import { text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { videos } from "./schema";

export const metadata = videos.table("metadata", {
    id: uuid().primaryKey(),
    // patient_id: uuid().references(patients),
    filename: varchar({ length: 255 }).notNull(),
    url: text().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    deletedAt: timestamp()
});