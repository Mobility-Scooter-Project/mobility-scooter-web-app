import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1759295034148 implements MigrationInterface {
  name = 'Init1759295034148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "orgs"`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "units"`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "users"`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "videos"`);

    await queryRunner.query(
      `CREATE TYPE "orgs"."application_status_enum" AS ENUM('pending', 'approved', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orgs"."application" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "orgs"."application_status_enum" NOT NULL DEFAULT 'pending', "statusUpdatedBy" character varying(255) NOT NULL, "statusMessage" text NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_569e0c3e863ebdf5f2408ee1670" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "orgs"."org" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "location" character varying(255) NOT NULL, "applicationId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "REL_6110d072780dc2530458daa22f" UNIQUE ("applicationId"), CONSTRAINT "PK_703783130f152a752cadf7aa751" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "orgs"."department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "orgId" uuid, CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "departmentId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_4252c4be609041e559f0c80f58a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."patient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "age" integer NOT NULL, "gender" character varying(10) NOT NULL, "notes" jsonb NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "videos"."patient_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_86bcf7cf616a03bd3d4902d159e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users"."user_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "givenName" character varying(255), "surname" character varying(255), "role" "users"."user_role_enum" NOT NULL, "passwordHash" character varying(255), "title" character varying(255), "phoneNumber" character varying(20), "city" character varying(255), "pfpUrl" text, "unitId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL, "name" character varying(255) NOT NULL, "path" text NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "videos"."video" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "units"."assignment_status_enum" AS ENUM('todo', 'in_progress', 'submitted', 'approved', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."assignment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dueBy" TIMESTAMP NOT NULL, "status" "units"."assignment_status_enum" NOT NULL DEFAULT 'todo', "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "videos"."video_label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "videoId" uuid, "assignmentId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_cb58407551f39f22ac8df128152" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "videos"."keypoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "videoId" uuid, "assignmentId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_35365f3c046cd711d71f76753fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users"."user_identity_provider_enum" AS ENUM('email', 'idp')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_identity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "users"."user_identity_provider_enum" NOT NULL DEFAULT 'email', "providerData" jsonb, "userId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_87b5856b206b5b77e6e2fa29508" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identityId" uuid NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_adf3b49590842ac3cf54cac451a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users"."route_permissions_method_enum" AS ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users"."route_permissions_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."route_permissions" ("id" SERIAL NOT NULL, "route" character varying(255) NOT NULL, "method" "users"."route_permissions_method_enum" NOT NULL, "role" "users"."route_permissions_role_enum" array NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f4ebaa8b53a13bdf4da12a1b742" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_34b9aaca7c015ff832ae3150b1" ON "users"."route_permissions" ("route", "method", "role") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "sessionId" uuid NOT NULL, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "units"."unit_invite_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "units"."unit_invite_status_enum" AS ENUM('pending', 'accepted', 'revoked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."unit_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "units"."unit_invite_role_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "invite_url" text NOT NULL, "status" "units"."unit_invite_status_enum" NOT NULL DEFAULT 'pending', "inviteeEmail" character varying(255) NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP, "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_42f3eb5a196648b1f27e6d41edb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orgs"."org" ADD CONSTRAINT "FK_6110d072780dc2530458daa22f8" FOREIGN KEY ("applicationId") REFERENCES "orgs"."application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orgs"."department" ADD CONSTRAINT "FK_95c36d42d7ed61587f431dfce00" FOREIGN KEY ("orgId") REFERENCES "orgs"."org"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "units"."unit" ADD CONSTRAINT "FK_c93ddd4d9643186a0db8c26234c" FOREIGN KEY ("departmentId") REFERENCES "orgs"."department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD CONSTRAINT "FK_856a1f0347b672d3b8bb4693bd8" FOREIGN KEY ("unitId") REFERENCES "units"."unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video" ADD CONSTRAINT "FK_a8bcb1684de47ff419c0698a038" FOREIGN KEY ("sessionId") REFERENCES "videos"."patient_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_label" ADD CONSTRAINT "FK_716f40791e1c5b40b08c5db7993" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_label" ADD CONSTRAINT "FK_1e97cef85f9129a50add4e52ed6" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "FK_3a1c5d8f26d26a1498748d0e6e6" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "FK_442704aae057917874daeebf720" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_identity" ADD CONSTRAINT "FK_6d46a525c55104a04b24cb66391" FOREIGN KEY ("userId") REFERENCES "users"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_session" ADD CONSTRAINT "FK_025574ba3f5e060798c6298ad55" FOREIGN KEY ("identityId") REFERENCES "users"."user_identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."refresh_token" ADD CONSTRAINT "FK_4f310b2b1f45ec02710a7193611" FOREIGN KEY ("sessionId") REFERENCES "users"."user_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users"."refresh_token" DROP CONSTRAINT "FK_4f310b2b1f45ec02710a7193611"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_session" DROP CONSTRAINT "FK_025574ba3f5e060798c6298ad55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_identity" DROP CONSTRAINT "FK_6d46a525c55104a04b24cb66391"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP CONSTRAINT "FK_442704aae057917874daeebf720"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP CONSTRAINT "FK_3a1c5d8f26d26a1498748d0e6e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_label" DROP CONSTRAINT "FK_1e97cef85f9129a50add4e52ed6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_label" DROP CONSTRAINT "FK_716f40791e1c5b40b08c5db7993"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video" DROP CONSTRAINT "FK_a8bcb1684de47ff419c0698a038"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" DROP CONSTRAINT "FK_856a1f0347b672d3b8bb4693bd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "units"."unit" DROP CONSTRAINT "FK_c93ddd4d9643186a0db8c26234c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orgs"."department" DROP CONSTRAINT "FK_95c36d42d7ed61587f431dfce00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orgs"."org" DROP CONSTRAINT "FK_6110d072780dc2530458daa22f8"`,
    );
    await queryRunner.query(`DROP TABLE "units"."unit_invite"`);
    await queryRunner.query(`DROP TYPE "units"."unit_invite_status_enum"`);
    await queryRunner.query(`DROP TYPE "units"."unit_invite_role_enum"`);
    await queryRunner.query(`DROP TABLE "users"."refresh_token"`);
    await queryRunner.query(
      `DROP INDEX "users"."IDX_34b9aaca7c015ff832ae3150b1"`,
    );
    await queryRunner.query(`DROP TABLE "users"."route_permissions"`);
    await queryRunner.query(`DROP TYPE "users"."route_permissions_role_enum"`);
    await queryRunner.query(
      `DROP TYPE "users"."route_permissions_method_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"."user_session"`);
    await queryRunner.query(`DROP TABLE "users"."user_identity"`);
    await queryRunner.query(`DROP TYPE "users"."user_identity_provider_enum"`);
    await queryRunner.query(`DROP TABLE "videos"."keypoint"`);
    await queryRunner.query(`DROP TABLE "videos"."video_label"`);
    await queryRunner.query(`DROP TABLE "units"."assignment"`);
    await queryRunner.query(`DROP TYPE "units"."assignment_status_enum"`);
    await queryRunner.query(`DROP TABLE "videos"."video"`);
    await queryRunner.query(`DROP TABLE "units"."file"`);
    await queryRunner.query(`DROP TABLE "users"."user"`);
    await queryRunner.query(`DROP TYPE "users"."user_role_enum"`);
    await queryRunner.query(`DROP TABLE "videos"."patient_session"`);
    await queryRunner.query(`DROP TABLE "units"."patient"`);
    await queryRunner.query(`DROP TABLE "units"."unit"`);
    await queryRunner.query(`DROP TABLE "orgs"."department"`);
    await queryRunner.query(`DROP TABLE "orgs"."org"`);
    await queryRunner.query(`DROP TABLE "orgs"."application"`);
    await queryRunner.query(`DROP TYPE "orgs"."application_status_enum"`);
  }
}
