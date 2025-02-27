import { DataSource, Repository } from "typeorm";
import { Teacher } from "../entities/teacher";

export class TeacherRepository {
  private readonly repo: Repository<Teacher>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Teacher);
  }

  async findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  async createAndSave(email: string) {
    const teacher = this.repo.create({ email });
    return this.repo.save(teacher);
  }
}
