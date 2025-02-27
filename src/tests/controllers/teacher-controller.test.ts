import { Request, Response } from "express";
import { TeacherController } from "../../controllers/teacher-controller";
import { TeacherRepository } from "../../repositories/teacher-repository";
import { StudentRepository } from "../../repositories/student-repository";

jest.mock("../repositories/TeacherRepository");
jest.mock("../repositories/StudentRepository");

describe("TeacherController", () => {
  let teacherController: TeacherController;
  let teacherRepository: jest.Mocked<TeacherRepository>;
  let studentRepository: jest.Mocked<StudentRepository>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    teacherRepository = new TeacherRepository(mockDa) as jest.Mocked<TeacherRepository>;
    studentRepository = new StudentRepository() as jest.Mocked<StudentRepository>;
    teacherController = new TeacherController( studentRepository,teacherRepository);
    
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockFindByEmail = (repo: any, email: string, result: any) => {
    (repo.findByEmail as jest.Mock).mockResolvedValueOnce(result);
  };

  const mockCreateAndSave = (repo: any, result: any) => {
    (repo.createAndSave as jest.Mock).mockResolvedValueOnce(result);
  };

  describe("registerStudents", () => {
    it("should register new students under a teacher", async () => {
      req.body = {
        teacher: "teacher@example.com",
        students: ["student1@example.com", "student2@example.com"],
      };

      mockFindByEmail(teacherRepository, "teacher@example.com", { email: "teacher@example.com" });
      req.body.students.forEach((student) => {
        mockFindByEmail(studentRepository, student, null);
        mockCreateAndSave(studentRepository, { email: student, teachers: [] });
      });

      await teacherController.registerStudents(req as Request, res as Response);

      expect(studentRepository.createAndSave).toHaveBeenCalledTimes(req.body.students.length);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should return 500 if an error occurs", async () => {
      req.body = { teacher: "teacher@example.com", students: ["student1@example.com"] };
      mockFindByEmail(teacherRepository, "teacher@example.com", null);
      (teacherRepository.createAndSave as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(
        teacherController.registerStudents(req as Request, res as Response)
      ).rejects.toThrow("Database error");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to register students" });
    });
  });
});
