import { Request, Response } from "express";
import { TeacherRepository } from "../repositories/teacher-repository";
import { StudentRepository } from "../repositories/student-repository";

export class TeacherController {
  private readonly studentRepository: StudentRepository;
  private readonly teacherRepository: TeacherRepository;

  constructor(
    studentRepository: StudentRepository,
    teacherRepository: TeacherRepository
  ) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
  }
  async registerStudents(req: Request, res: Response) {
    try {
      const { teacher, students }: { teacher: string; students: string[] } =
        req.body;

      let teacherEntity = await this.teacherRepository.findByEmail(teacher);
      if (!teacherEntity) {
        teacherEntity = await this.teacherRepository.createAndSave(teacher);
      }

      for (const studentEmail of students) {
        let studentEntity = await this.studentRepository.findByEmail(
          studentEmail
        );

        if (!studentEntity) {
          studentEntity = await this.studentRepository.createAndSave(
            studentEmail,
            [teacherEntity]
          );
        } else {
          studentEntity.teachers = [...studentEntity.teachers, teacherEntity];
          await this.studentRepository.createAndSave(
            studentEntity.email,
            studentEntity.teachers
          );
        }
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to register students" });
    }
  }

  async getCommonStudents(req: Request, res: Response) {
    try {
      const teacherQueryParam =
        typeof req.query.teacher === "string"
          ? [req.query.teacher]
          : (req.query.teacher as string[]);

      const students = await this.studentRepository.findCommonStudents(
        teacherQueryParam
      );

      res.status(200).json({ students: students.map((s) => s.email) });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error getting list of common students" });
    }
  }

  async retrieveForNotifications(req: Request, res: Response) {
    try {
      const { teacher, notification } = req.body;

      if (!notification) {
        return res
          .status(400)
          .json({ message: "Notification content is required" });
      }

      // Regex to match valid email addresses prefixed by '@' (ensuring valid email format)
      const mentionedEmails =
        notification
          .match(/@([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})/g)
          ?.map((e: string) => e.substring(1)) || [];

      // Validate if any emails failed the regex (only valid emails should be captured)
      if (mentionedEmails.length === 0) {
        return res
          .status(400)
          .json({ message: "No emails found in notification" });
      }

      // Fetch students based on the valid emails
      const students = await this.studentRepository.findForNotifications(
        teacher,
        mentionedEmails
      );


    
      res.status(200).json({ recipients: students.map((s) => s.email) });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error retrieving notification recipients" });
    }
  }
}
