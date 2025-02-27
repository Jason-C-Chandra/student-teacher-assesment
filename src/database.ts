import { DataSource } from "typeorm";
import { Teacher } from "./entities/teacher";
import { Student } from "./entities/student";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "user", // Match docker-compose
  password: "teacher_student_system_password",
  database: "teacher_student_system",
  entities: [Teacher, Student],
  logging: true,
  migrations: [`src/migrations/**/*{.ts,.js}`],
});
