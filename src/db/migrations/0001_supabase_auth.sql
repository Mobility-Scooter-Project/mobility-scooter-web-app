CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TABLE "auth"."audit_log_entries" (
	"instance_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"payload" json,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."instances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uuid" uuid,
	"raw_base_config" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."refresh_tokens" (
	"instance_id" uuid,
	"id" bigserial PRIMARY KEY NOT NULL,
	"token" varchar(255),
	"user_id" varchar(255),
	"revoked" boolean,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."schema_migrations" (
	"version" varchar(255) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"instance_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"aud" varchar(255),
	"role" varchar(255),
	"email" varchar(255),
	"encrypted_password" varchar(255),
	"confirmed_at" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"confirmation_token" varchar(255),
	"confirmation_sent_at" timestamp with time zone,
	"recovery_token" varchar(255),
	"recovery_sent_at" timestamp with time zone,
	"email_change_token" varchar(255),
	"email_change" varchar(255),
	"email_change_sent_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"raw_app_meta_data" jsonb,
	"raw_user_meta_data" jsonb,
	"is_super_admin" boolean,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING btree ("instance_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING btree ("instance_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING btree ("instance_id" uuid_ops,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_idx" ON "auth"."refresh_tokens" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING btree ("instance_id" uuid_ops,"email" text_ops);--> statement-breakpoint
CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING btree ("instance_id" uuid_ops);