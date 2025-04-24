ALTER TYPE "public"."video_status" ADD VALUE 'annotation approved';--> statement-breakpoint
ALTER TYPE "public"."video_status" ADD VALUE 'annotation created';--> statement-breakpoint
CREATE TABLE "videos"."keypoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"name" varchar(30) NOT NULL,
	"timestamp" varchar(30) NOT NULL,
	"coordinates" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "videos"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"task" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos"."transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"path" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "videos"."status" RENAME TO "events";--> statement-breakpoint
ALTER TABLE "videos"."metadata" RENAME COLUMN "filename" TO "path";--> statement-breakpoint
ALTER TABLE "videos"."events" DROP CONSTRAINT "status_video_id_metadata_id_fk";
--> statement-breakpoint
ALTER TABLE "videos"."metadata" ALTER COLUMN "patient_id" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "videos"."metadata" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "videos"."metadata" ADD COLUMN "date" timestamp;--> statement-breakpoint
ALTER TABLE "videos"."keypoints" ADD CONSTRAINT "keypoints_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos"."tasks" ADD CONSTRAINT "tasks_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos"."transcripts" ADD CONSTRAINT "transcripts_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos"."metadata" ADD CONSTRAINT "metadata_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "videos"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos"."events" DROP COLUMN "video_id";--> statement-breakpoint
ALTER TABLE "videos"."metadata" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "videos"."metadata" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "videos"."metadata" DROP COLUMN "deleted_at";--> statement-breakpoint