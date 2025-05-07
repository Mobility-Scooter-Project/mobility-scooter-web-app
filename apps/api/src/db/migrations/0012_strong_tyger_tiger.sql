ALTER TABLE "videos"."tasks" ADD COLUMN "task_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "videos"."tasks" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "videos"."tasks" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "videos"."tasks" ADD COLUMN "deleted_at" timestamp;