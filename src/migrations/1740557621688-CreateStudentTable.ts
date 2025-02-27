import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudentTable1740557621688 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`student\` (
        \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`email\` VARCHAR(255) UNIQUE NOT NULL,
        \`isSuspended\` TINYINT(1) DEFAULT 0
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`student\`;`);
  }
}
