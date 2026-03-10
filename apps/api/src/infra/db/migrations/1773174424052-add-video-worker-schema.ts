import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoWorkerSchema1773174424052 implements MigrationInterface {
  name = 'AddVideoWorkerSchema1773174424052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create video_worker schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "video_worker"`);

    // video_worker.event
    await queryRunner.query(
      `CREATE TABLE "video_worker"."event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "step" text NOT NULL, "status" text NOT NULL, "videoId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_worker"."event" ADD CONSTRAINT "FK_3d31dc538cd08efe627df783e6b" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // video_worker.status
    await queryRunner.query(
      `CREATE TABLE "video_worker"."status" ("videoId" uuid NOT NULL, "statusEventId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "REL_cde63259abb6942899a221cca8" UNIQUE ("statusEventId"), CONSTRAINT "PK_907153a55e6155ab1675f54527c" PRIMARY KEY ("videoId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_worker"."status" ADD CONSTRAINT "FK_907153a55e6155ab1675f54527c" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_worker"."status" ADD CONSTRAINT "FK_cde63259abb6942899a221cca85" FOREIGN KEY ("statusEventId") REFERENCES "video_worker"."event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // video_worker.step_status
    await queryRunner.query(
      `CREATE TABLE "video_worker"."step_status" ("videoId" uuid NOT NULL, "step" text NOT NULL, "status" text NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "lastError" text, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_af0e564126a51c53f890e8cee32" PRIMARY KEY ("videoId", "step"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_worker"."step_status" ADD CONSTRAINT "FK_e7825e6aac3e1a0c0972ffd3dc4" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // videos.video_task (new table)
    await queryRunner.query(
      `CREATE TABLE "videos"."video_task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tasks" jsonb NOT NULL, "videoId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "UQ_226ec069c8a4f2d88fc712bdae4" UNIQUE ("videoId"), CONSTRAINT "PK_65eb0fba87a8fce66347b06c5a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_task" ADD CONSTRAINT "FK_226ec069c8a4f2d88fc712bdae4" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // videos.video_annotation (new table)
    await queryRunner.query(
      `CREATE TABLE "videos"."video_annotation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetType" text NOT NULL, "targetId" uuid, "changes" jsonb NOT NULL, "assignmentId" uuid, "videoId" uuid, "cuCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "cuUpdatedat" TIMESTAMP, CONSTRAINT "PK_46cbd98f17d72fe078e882fa617" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_annotation" ADD CONSTRAINT "FK_2e5be85cce08488d28d2eea7665" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_annotation" ADD CONSTRAINT "FK_b9ead20ef056821891896bb4d21" FOREIGN KEY ("videoId") REFERENCES "videos"."video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Alter videos.keypoint: drop old columns, add new ones
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP CONSTRAINT IF EXISTS "FK_442704aae057917874daeebf720"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN IF EXISTS "data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN IF EXISTS "assignmentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "frameIndex" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "timestamp" double precision NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "angle" double precision NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "keypoints" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "UQ_0289c016796a069275fed1f4d35" UNIQUE ("videoId", "frameIndex")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert keypoint changes
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP CONSTRAINT "UQ_0289c016796a069275fed1f4d35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN "keypoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN "angle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN "timestamp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" DROP COLUMN "frameIndex"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "assignmentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD "data" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."keypoint" ADD CONSTRAINT "FK_442704aae057917874daeebf720" FOREIGN KEY ("assignmentId") REFERENCES "units"."assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Drop video_annotation
    await queryRunner.query(
      `ALTER TABLE "videos"."video_annotation" DROP CONSTRAINT "FK_b9ead20ef056821891896bb4d21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos"."video_annotation" DROP CONSTRAINT "FK_2e5be85cce08488d28d2eea7665"`,
    );
    await queryRunner.query(`DROP TABLE "videos"."video_annotation"`);

    // Drop video_task
    await queryRunner.query(
      `ALTER TABLE "videos"."video_task" DROP CONSTRAINT "FK_226ec069c8a4f2d88fc712bdae4"`,
    );
    await queryRunner.query(`DROP TABLE "videos"."video_task"`);

    // Drop step_status
    await queryRunner.query(
      `ALTER TABLE "video_worker"."step_status" DROP CONSTRAINT "FK_e7825e6aac3e1a0c0972ffd3dc4"`,
    );
    await queryRunner.query(`DROP TABLE "video_worker"."step_status"`);

    // Drop status
    await queryRunner.query(
      `ALTER TABLE "video_worker"."status" DROP CONSTRAINT "FK_cde63259abb6942899a221cca85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_worker"."status" DROP CONSTRAINT "FK_907153a55e6155ab1675f54527c"`,
    );
    await queryRunner.query(`DROP TABLE "video_worker"."status"`);

    // Drop event
    await queryRunner.query(
      `ALTER TABLE "video_worker"."event" DROP CONSTRAINT "FK_3d31dc538cd08efe627df783e6b"`,
    );
    await queryRunner.query(`DROP TABLE "video_worker"."event"`);

    // Drop schema
    await queryRunner.query(`DROP SCHEMA IF EXISTS "video_worker"`);
  }
}
