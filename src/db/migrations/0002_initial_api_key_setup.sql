CREATE TABLE "auth"."api_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"encrypted_key" text NOT NULL,
	"owner" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"deletedAt" timestamp
);
