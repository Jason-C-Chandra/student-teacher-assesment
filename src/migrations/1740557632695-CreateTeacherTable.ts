import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTeacherTable1740557632695 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`teacher\` (
        \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
        \`email\` VARCHAR(255) UNIQUE NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`teacher\`;`);
  }
}
