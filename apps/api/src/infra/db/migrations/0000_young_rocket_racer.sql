CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "storage";
--> statement-breakpoint
CREATE SCHEMA "tenants";
--> statement-breakpoint
CREATE TYPE "auth"."providers" AS ENUM('emailpass');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('pending', 'processing', 'processed', 'failed', 'annotation approved', 'annotation created');--> statement-breakpoint
CREATE ROLE "anonymous_user";--> statement-breakpoint
CREATE ROLE "authenticated_user";--> statement-breakpoint
CREATE TABLE "auth"."api_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"encrypted_key" text NOT NULL,
	"owner" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth"."identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth"."providers" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"token" text NOT NULL,
	"revoked" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."reset_password_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"used_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "auth"."reset_password_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refreshed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"email" text NOT NULL,
	"encrypted_password" text,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"last_signed_in_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "storage"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "video_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "storage"."metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"status_event_id" uuid NOT NULL,
	"path" varchar(255) NOT NULL,
	"uploaded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "storage"."keypoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" uuid NOT NULL,
	"timestamp" varchar(30) NOT NULL,
	"angle" real,
	"keypoints" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "storage"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"task_id" integer DEFAULT 1 NOT NULL,
	"task" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenants"."metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenants"."units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"admin_user_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."reset_password_tokens" ADD CONSTRAINT "reset_password_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "tenants"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."metadata" ADD CONSTRAINT "metadata_status_event_id_events_id_fk" FOREIGN KEY ("status_event_id") REFERENCES "storage"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."keypoints" ADD CONSTRAINT "keypoints_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "storage"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage"."tasks" ADD CONSTRAINT "tasks_video_id_metadata_id_fk" FOREIGN KEY ("video_id") REFERENCES "storage"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants"."units" ADD CONSTRAINT "units_tenant_id_metadata_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"."metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "allow authenticated users to read their own identities" ON "auth"."identities" AS PERMISSIVE FOR SELECT TO "authenticated_user" USING (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to create their own identities" ON "auth"."identities" AS PERMISSIVE FOR INSERT TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to update their own identities" ON "auth"."identities" AS PERMISSIVE FOR UPDATE TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to read their own refresh tokens" ON "auth"."refresh_tokens" AS PERMISSIVE FOR SELECT TO "authenticated_user" USING (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to create their own refresh tokens" ON "auth"."refresh_tokens" AS PERMISSIVE FOR INSERT TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to read their own reset password tokens" ON "auth"."reset_password_tokens" AS PERMISSIVE FOR SELECT TO "authenticated_user" USING (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to create their own reset password tokens" ON "auth"."reset_password_tokens" AS PERMISSIVE FOR INSERT TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to update their own reset password tokens" ON "auth"."reset_password_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to read their own sessions" ON "auth"."sessions" AS PERMISSIVE FOR SELECT TO "authenticated_user" USING (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to create their own sessions" ON "auth"."sessions" AS PERMISSIVE FOR INSERT TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to update their own sessions" ON "auth"."sessions" AS PERMISSIVE FOR UPDATE TO "authenticated_user" WITH CHECK (user_id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow unauthenticated users to create an account" ON "auth"."users" AS PERMISSIVE FOR INSERT TO "anonymous_user" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "allow unauthenticated users to login" ON "auth"."users" AS PERMISSIVE FOR SELECT TO "anonymous_user" USING (true);--> statement-breakpoint
CREATE POLICY "allow authenticated users to read their own data" ON "auth"."users" AS PERMISSIVE FOR SELECT TO "authenticated_user" USING (id = current_setting('app.user_id')::uuid);--> statement-breakpoint
CREATE POLICY "allow authenticated users to update their own data" ON "auth"."users" AS PERMISSIVE FOR UPDATE TO "authenticated_user" USING (id = current_setting('app.user_id')::uuid);