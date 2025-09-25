import { MigrationInterface, QueryRunner } from "typeorm";

export class Assignmentsetup1758836162884 implements MigrationInterface {
    name = 'Assignmentsetup1758836162884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "units"."assignment_status_enum" AS ENUM('todo', 'in_progress', 'submitted', 'approved', 'denied')`);
        await queryRunner.query(`CREATE TABLE "units"."assignment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dueBy" TIMESTAMP NOT NULL, "status" "units"."assignment_status_enum" NOT NULL DEFAULT 'todo', "cudCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "cudDeletedat" TIMESTAMP, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" ADD "assignmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" ADD "assignmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" ADD CONSTRAINT "FK_1e97cef85f9129a50add4e52ed6" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "FK_442704aae057917874daeebf720" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" DROP CONSTRAINT "FK_442704aae057917874daeebf720"`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" DROP CONSTRAINT "FK_1e97cef85f9129a50add4e52ed6"`);
        await queryRunner.query(`ALTER TABLE "videos"."keypoint" DROP COLUMN "assignmentId"`);
        await queryRunner.query(`ALTER TABLE "videos"."video_label" DROP COLUMN "assignmentId"`);
        await queryRunner.query(`DROP TABLE "units"."assignment"`);
        await queryRunner.query(`DROP TYPE "units"."assignment_status_enum"`);
    }

}
