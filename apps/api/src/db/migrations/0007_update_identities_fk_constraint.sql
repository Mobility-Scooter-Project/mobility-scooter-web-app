ALTER TABLE "auth"."identities" DROP CONSTRAINT "identities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;