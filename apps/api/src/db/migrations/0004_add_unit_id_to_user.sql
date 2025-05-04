ALTER TABLE "tenants"."units" DROP CONSTRAINT "units_admin_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "unit_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "tenants"."units"("id") ON DELETE no action ON UPDATE no action;