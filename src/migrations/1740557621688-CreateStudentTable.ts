import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudentTable1740557621688 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`student\` (
        \`id\` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
        \`email\` VARCHAR(255) UNIQUE NOT NULL,
        \`isSuspended\` TINYINT(1) DEFAULT 0
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`student\`;`);
  }
}
