import { MigrationInterface, QueryRunner } from 'typeorm';

export class Permissions1759260181036 implements MigrationInterface {
  name = 'Permissions1759260181036';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TYPE "units"."unit_invite_role_enum" AS ENUM('lead', 'researcher', 'trainee', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "units"."unit_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "units"."unit_invite_role_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "invite_url" text NOT NULL, CONSTRAINT "PK_42f3eb5a196648b1f27e6d41edb" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "units"."unit_invite"`);
    await queryRunner.query(`DROP TYPE "units"."unit_invite_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "users"."IDX_34b9aaca7c015ff832ae3150b1"`,
    );
    await queryRunner.query(`DROP TABLE "users"."route_permissions"`);
    await queryRunner.query(`DROP TYPE "users"."route_permissions_role_enum"`);
    await queryRunner.query(
      `DROP TYPE "users"."route_permissions_method_enum"`,
    );
  }
}
