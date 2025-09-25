import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthServiceFix1758838276692 implements MigrationInterface {
    name = 'AuthServiceFix1758838276692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users"."user_identity" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "users"."user_identity" ADD CONSTRAINT "FK_6d46a525c55104a04b24cb66391" FOREIGN KEY ("userId") REFERENCES "users"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users"."user_identity" DROP CONSTRAINT "FK_6d46a525c55104a04b24cb66391"`);
        await queryRunner.query(`ALTER TABLE "users"."user_identity" DROP COLUMN "userId"`);
    }

}
