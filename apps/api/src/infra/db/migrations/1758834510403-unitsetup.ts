import { MigrationInterface, QueryRunner } from "typeorm";

export class Unitsetup1758834510403 implements MigrationInterface {
    name = 'Unitsetup1758834510403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "units"`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "users"`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" DROP CONSTRAINT "FK_95c36d42d7ed61587f431dfce00"`);
        await queryRunner.query(`CREATE TABLE "orgs"."org" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "location" character varying(255) NOT NULL, "applicationId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "REL_6110d072780dc2530458daa22f" UNIQUE ("applicationId"), CONSTRAINT "PK_703783130f152a752cadf7aa751" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "units"."unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "departmentId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_4252c4be609041e559f0c80f58a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "users"."user_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "givenName" character varying(255) NOT NULL, "surname" character varying(255) NOT NULL, "role" "users"."user_role_enum" NOT NULL, "passwordHash" character varying(255) NOT NULL, "unitId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "units"."patient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "age" integer NOT NULL, "gender" character varying(10) NOT NULL, "notes" jsonb NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."unit_invite_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`);
        await queryRunner.query(`CREATE TABLE "unit_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."unit_invite_role_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "invite_url" text NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_42f3eb5a196648b1f27e6d41edb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "units"."file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL, "name" character varying(255) NOT NULL, "path" text NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orgs"."org" ADD CONSTRAINT "FK_6110d072780dc2530458daa22f8" FOREIGN KEY ("applicationId") REFERENCES "orgs"."application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" ADD CONSTRAINT "FK_95c36d42d7ed61587f431dfce00" FOREIGN KEY ("orgId") REFERENCES "orgs"."org"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "units"."unit" ADD CONSTRAINT "FK_c93ddd4d9643186a0db8c26234c" FOREIGN KEY ("departmentId") REFERENCES "orgs"."department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users"."user" ADD CONSTRAINT "FK_856a1f0347b672d3b8bb4693bd8" FOREIGN KEY ("unitId") REFERENCES "units"."unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users"."user" DROP CONSTRAINT "FK_856a1f0347b672d3b8bb4693bd8"`);
        await queryRunner.query(`ALTER TABLE "units"."unit" DROP CONSTRAINT "FK_c93ddd4d9643186a0db8c26234c"`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" DROP CONSTRAINT "FK_95c36d42d7ed61587f431dfce00"`);
        await queryRunner.query(`ALTER TABLE "orgs"."org" DROP CONSTRAINT "FK_6110d072780dc2530458daa22f8"`);
        await queryRunner.query(`DROP TABLE "units"."file"`);
        await queryRunner.query(`DROP TABLE "unit_invite"`);
        await queryRunner.query(`DROP TYPE "public"."unit_invite_role_enum"`);
        await queryRunner.query(`DROP TABLE "units"."patient"`);
        await queryRunner.query(`DROP TABLE "users"."user"`);
        await queryRunner.query(`DROP TYPE "users"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "units"."unit"`);
        await queryRunner.query(`DROP TABLE "orgs"."org"`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" ADD CONSTRAINT "FK_95c36d42d7ed61587f431dfce00" FOREIGN KEY ("orgId") REFERENCES "orgs"."org_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
