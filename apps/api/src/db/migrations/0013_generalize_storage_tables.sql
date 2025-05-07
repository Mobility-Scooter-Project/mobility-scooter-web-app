ALTER SCHEMA "videos" RENAME TO "storage";
--> statement-breakpoint
ALTER TABLE "storage"."transcripts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "storage"."transcripts" CASCADE;--> statement-breakpoint
ALTER TABLE "storage"."metadata" RENAME COLUMN "event_id" TO "status_event_id";--> statement-breakpoint
ALTER TABLE "storage"."metadata" RENAME COLUMN "date" TO "uploaded_at";--> statement-breakpoint
ALTER TABLE "storage"."keypoints" DROP CONSTRAINT "keypoints_video_id_metadata_id_fk";
--> statement-breakpoint
ALTER TABLE "storage"."metadata" DROP CONSTRAINT "metadata_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "storage"."tasks" DROP CONSTRAINT "tasks_video_id_metadata_id_fk";
--> statement-breakpoint
ALTER TABLE "storage"."metadata" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "storage"."metadata" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "storage"."metadata" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "storage"."keypoints" ADD CONSTRAINT "keypoints_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "storage"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."metadata" ADD CONSTRAINT "metadata_status_event_id_events_id_fk" FOREIGN KEY ("status_event_id") REFERENCES "storage"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."tasks" ADD CONSTRAINT "tasks_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "storage"."metadata"("id") ON DELETE no action ON UPDATE no action;