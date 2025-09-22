CREATE TYPE "public"."annotation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "storage"."annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitterId" uuid NOT NULL,
	"reviewerId" uuid,
	"videoId" uuid NOT NULL,
	"status" "annotation_status" DEFAULT 'pending' NOT NULL,
	"comments" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "storage"."annotations" ADD CONSTRAINT "annotations_submitterId_users_id_fk" FOREIGN KEY ("submitterId") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."annotations" ADD CONSTRAINT "annotations_reviewerId_users_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."annotations" ADD CONSTRAINT "annotations_videoId_metadata_id_fk" FOREIGN KEY ("videoId") REFERENCES "storage"."metadata"("id") ON DELETE cascade ON UPDATE no action;