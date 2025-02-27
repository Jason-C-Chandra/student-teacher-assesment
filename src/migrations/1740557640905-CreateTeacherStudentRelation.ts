import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTeacherStudentRelation1740557640905
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`teacher_students_student\` (
        \`teacherId\` BIGINT UNSIGNED NOT NULL,
        \`studentId\` BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (\`teacherId\`, \`studentId\`),
        CONSTRAINT \`FK_teacher_students_teacher\` FOREIGN KEY (\`teacherId\`) 
          REFERENCES \`teacher\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_teacher_students_student\` FOREIGN KEY (\`studentId\`) 
          REFERENCES \`student\`(\`id\`) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`teacher_students_student\`;`);
  }
}
