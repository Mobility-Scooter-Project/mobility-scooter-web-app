import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProfile1759185413177 implements MigrationInterface {
  name = 'UpdateProfile1759185413177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD "title" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD "phoneNumber" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD "city" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "users"."user" ADD "pfpUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user" DROP COLUMN "pfpUrl"`);
    await queryRunner.query(`ALTER TABLE "users"."user" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "users"."user" DROP COLUMN "phoneNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "users"."user" DROP COLUMN "title"`);
  }
}
