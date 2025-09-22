import { pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { storage, fileMetadata } from "./storage";  
import { users } from "./auth";                    

export const annotationStatus = pgEnum("annotation_status", [
  "pending",
  "approved",
  "rejected",
]);

export const annotations = storage.table("annotations", {
  id: uuid().primaryKey().defaultRandom(),

  submitterId: uuid("submitterId")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  reviewerId: uuid("reviewerId")
    .references(() => users.id, { onDelete: "set null" }),

  videoId: uuid("videoId")
    .notNull()
    .references(() => fileMetadata.id, { onDelete: "cascade" }),

  status: annotationStatus().notNull().default("pending"),
  comments: text("comments"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});
