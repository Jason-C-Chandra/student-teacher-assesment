import { Student } from "../entities/student";
import { Brackets, DataSource, Repository } from "typeorm";

export class StudentRepository {
  private readonly repo: Repository<Student>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Student);
  }

  async findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  async createAndSave(email: string, teachers: any[]) {
    const student = this.repo.create({ email, teachers });
    return this.repo.save(student);
  }

  async updateSuspendedStatus(email: string, isSuspended: boolean) {
    return this.repo.update({ email }, { isSuspended });
  }

  async findCommonStudents(teachers: string[]) {
    return this.repo
      .createQueryBuilder("student")
      .leftJoin("student.teachers", "teacher")
      .where("teacher.email IN (:...teachers)", { teachers })
      .groupBy("student.email")
      .having("COUNT(DISTINCT teacher.id) = :numTeachers", {
        numTeachers: teachers.length,
      })
      .select("student.email")
      .getMany();
  }

  async findForNotifications(teacher: string, mentionedEmails: string[]) {
    return await this.repo
      .createQueryBuilder("student")
      .leftJoin("student.teachers", "teacher")
      .where("student.isSuspended = :isSuspended", { isSuspended: false }) // Apply first!
      .andWhere(
        new Brackets((qb) => {
          qb.where("teacher.email = :teacher", { teacher });
        })
      )
      .andWhere("student.email IN (:...mentionedEmails)", { mentionedEmails })
      .select("student.email")
      .getMany();
  }
}
