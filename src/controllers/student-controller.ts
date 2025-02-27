import { Request, Response } from "express";
import { StudentRepository } from "../repositories/student-repository";

export class StudentController {
  private readonly studentRepository: StudentRepository;

  constructor(studentRepository: StudentRepository) {
    this.studentRepository = studentRepository;
  }

  async suspendStudent(req: Request, res: Response) {
    try {
      const { student } = req.body;
      const studentAvailable = await this.studentRepository.findByEmail(
        student
      );
      if (studentAvailable) {
        await this.studentRepository.updateSuspendedStatus(student, true);
      } else {
        return res
          .status(400)
          .json({ message: "Failed to find student with that email" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to suspend student" });
    }
  }
}
