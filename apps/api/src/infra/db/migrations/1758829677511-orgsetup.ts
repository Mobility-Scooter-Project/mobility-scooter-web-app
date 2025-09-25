import { MigrationInterface, QueryRunner } from "typeorm";

export class Orgsetup1758829677511 implements MigrationInterface {
    name = 'Orgsetup1758829677511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "orgs"`);
        await queryRunner.query(`CREATE TYPE "orgs"."application_status_enum" AS ENUM('pending', 'approved', 'denied')`);
        await queryRunner.query(`CREATE TABLE "orgs"."application" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "orgs"."application_status_enum" NOT NULL DEFAULT 'pending', "statusUpdatedBy" character varying(255) NOT NULL, "statusMessage" text NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_569e0c3e863ebdf5f2408ee1670" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orgs"."department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid, CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orgs"."org_metadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "location" character varying(255) NOT NULL, "applicationId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "REL_4731e7fe300cd0cec7b81b3523" UNIQUE ("applicationId"), CONSTRAINT "PK_4a9469e29af117801df4ecc900b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" ADD CONSTRAINT "FK_95c36d42d7ed61587f431dfce00" FOREIGN KEY ("orgId") REFERENCES "orgs"."org_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orgs"."org_metadata" ADD CONSTRAINT "FK_4731e7fe300cd0cec7b81b35239" FOREIGN KEY ("applicationId") REFERENCES "orgs"."application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orgs"."org_metadata" DROP CONSTRAINT "FK_4731e7fe300cd0cec7b81b35239"`);
        await queryRunner.query(`ALTER TABLE "orgs"."department" DROP CONSTRAINT "FK_95c36d42d7ed61587f431dfce00"`);
        await queryRunner.query(`DROP TABLE "orgs"."org_metadata"`);
        await queryRunner.query(`DROP TABLE "orgs"."department"`);
        await queryRunner.query(`DROP TABLE "orgs"."application"`);
        await queryRunner.query(`DROP TYPE "orgs"."application_status_enum"`);
    }

}
