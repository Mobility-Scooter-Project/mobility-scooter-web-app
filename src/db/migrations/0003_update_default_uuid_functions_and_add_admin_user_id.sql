ALTER TABLE "auth"."identities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "auth"."sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "auth"."users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tenants"."metadata" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tenants"."units" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tenants"."units" ADD COLUMN "admin_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants"."units" ADD CONSTRAINT "units_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;