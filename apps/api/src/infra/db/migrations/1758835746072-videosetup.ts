import { MigrationInterface, QueryRunner } from "typeorm";

export class Videosetup1758835746072 implements MigrationInterface {
    name = 'Videosetup1758835746072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "videos"`);
        await queryRunner.query(`CREATE TABLE "videos"."patient_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_86bcf7cf616a03bd3d4902d159e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "videos"."video" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid, "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "videos"."video_label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "videoId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb58407551f39f22ac8df128152" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "videos"."keypoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "videoId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35365f3c046cd711d71f76753fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "videos"."video" ADD CONSTRAINT "FK_a8bcb1684de47ff419c0698a038" FOREIGN KEY ("sessionId") REFERENCES "videos"."patient_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" ADD CONSTRAINT "FK_716f40791e1c5b40b08c5db7993" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "FK_3a1c5d8f26d26a1498748d0e6e6" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" DROP CONSTRAINT "FK_3a1c5d8f26d26a1498748d0e6e6"`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" DROP CONSTRAINT "FK_716f40791e1c5b40b08c5db7993"`);
        await queryRunner.query(`ALTER TABLE "videos"."video" DROP CONSTRAINT "FK_a8bcb1684de47ff419c0698a038"`);
        await queryRunner.query(`DROP TABLE "videos"."keypoint"`);
        await queryRunner.query(`DROP TABLE "videos"."video_label"`);
        await queryRunner.query(`DROP TABLE "videos"."video"`);
        await queryRunner.query(`DROP TABLE "videos"."patient_session"`);
    }

}
