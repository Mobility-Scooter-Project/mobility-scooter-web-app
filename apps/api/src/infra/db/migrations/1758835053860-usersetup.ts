import { MigrationInterface, QueryRunner } from "typeorm";

export class Usersetup1758835053860 implements MigrationInterface {
    name = 'Usersetup1758835053860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "users"."user_identity_provider_enum" AS ENUM('email', 'idp')`);
        await queryRunner.query(`CREATE TABLE "users"."user_identity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "users"."user_identity_provider_enum" NOT NULL DEFAULT 'email', "providerData" jsonb, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_87b5856b206b5b77e6e2fa29508" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users"."user_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identityId" uuid NOT NULL, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_adf3b49590842ac3cf54cac451a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users"."refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "sessionId" uuid NOT NULL, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users"."user_session" ADD CONSTRAINT "FK_025574ba3f5e060798c6298ad55" FOREIGN KEY ("identityId") REFERENCES "users"."user_identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users"."refresh_token" ADD CONSTRAINT "FK_4f310b2b1f45ec02710a7193611" FOREIGN KEY ("sessionId") REFERENCES "users"."user_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users"."refresh_token" DROP CONSTRAINT "FK_4f310b2b1f45ec02710a7193611"`);
        await queryRunner.query(`ALTER TABLE "users"."user_session" DROP CONSTRAINT "FK_025574ba3f5e060798c6298ad55"`);
        await queryRunner.query(`DROP TABLE "users"."refresh_token"`);
        await queryRunner.query(`DROP TABLE "users"."user_session"`);
        await queryRunner.query(`DROP TABLE "users"."user_identity"`);
        await queryRunner.query(`DROP TYPE "users"."user_identity_provider_enum"`);
    }

}
