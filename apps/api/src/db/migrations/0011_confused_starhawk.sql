ALTER TABLE "videos"."keypoints" RENAME COLUMN "coordinates" TO "keypoints";--> statement-breakpoint
ALTER TABLE "videos"."transcripts" ALTER COLUMN "path" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "videos"."keypoints" ADD COLUMN "angle" real;--> statement-breakpoint
ALTER TABLE "videos"."keypoints" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "videos"."transcripts" DROP COLUMN "updated_at";