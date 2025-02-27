import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Teacher } from "./teacher";

@Entity()
export class Student {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isSuspended: boolean;

  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];
}
