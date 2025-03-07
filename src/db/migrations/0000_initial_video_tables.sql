CREATE SCHEMA "videos";
--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('pending', 'processing', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "videos"."metadata" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "videos"."status" (
	"id" uuid PRIMARY KEY NOT NULL,
	"video_id" uuid NOT NULL,
	"status" "video_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "videos"."status" ADD CONSTRAINT "status_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"."metadata"("id") ON DELETE no action ON UPDATE no action;