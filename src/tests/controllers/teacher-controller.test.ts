import { Request, Response } from "express";
import { StudentRepository } from "../../repositories/student-repository";
import { TeacherRepository } from "../../repositories/teacher-repository";
import { DataSource } from "typeorm";
import { StudentController } from "../../controllers/student-controller";
import { TeacherController } from "../../controllers/teacher-controller";

jest.mock("../../repositories/student-repository");
jest.mock("../../repositories/teacher-repository");

const mockDataSource = {} as DataSource;
let studentRepository: jest.Mocked<StudentRepository>;
let teacherRepository: jest.Mocked<TeacherRepository>;
let studentController: StudentController;
let teacherController: TeacherController;

describe("TeacherController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    studentRepository = new StudentRepository(mockDataSource) as jest.Mocked<StudentRepository>;
    teacherRepository = new TeacherRepository(mockDataSource) as jest.Mocked<TeacherRepository>;

    studentRepository.updateSuspendedStatus = jest.fn();
    teacherRepository.findByEmail = jest.fn();
    teacherRepository.createAndSave = jest.fn();

    studentController = new StudentController(studentRepository);
    teacherController = new TeacherController(studentRepository, teacherRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerStudents", () => {
    it("should register a teacher and students successfully", async () => {
      req.body = {
        teacher: "teacher@example.com",
        students: ["student1@example.com", "student2@example.com"],
      };

      (teacherRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (teacherRepository.createAndSave as jest.Mock).mockResolvedValue({ email: "teacher@example.com" });
      (studentRepository.findByEmail as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (studentRepository.createAndSave as jest.Mock)
        .mockResolvedValueOnce({ email: "student1@example.com", teachers: [] })
        .mockResolvedValueOnce({ email: "student2@example.com", teachers: [] });

      await teacherController.registerStudents(req as Request, res as Response);

      expect(teacherRepository.findByEmail).toHaveBeenCalledWith("teacher@example.com");
      expect(teacherRepository.createAndSave).toHaveBeenCalledWith("teacher@example.com");
      expect(studentRepository.findByEmail).toHaveBeenCalledTimes(2);
      expect(studentRepository.createAndSave).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should update the student's teachers if the student exists", async () => {
      req.body = {
        teacher: "teacher@example.com",
        students: ["student1@example.com", "student2@example.com"],
      };

      (teacherRepository.findByEmail as jest.Mock).mockResolvedValue({ email: "teacher@example.com" });
      (studentRepository.findByEmail as jest.Mock)
        .mockResolvedValueOnce({ email: "student1@example.com", teachers: [] })
        .mockResolvedValueOnce({ email: "student2@example.com", teachers: [{ email: "teacher1@example.com" }] });
      (studentRepository.createAndSave as jest.Mock)
        .mockResolvedValueOnce({ email: "student1@example.com", teachers: [{ email: "teacher@example.com" }] })
        .mockResolvedValueOnce({ email: "student2@example.com", teachers: [{ email: "teacher1@example.com" }, { email: "teacher@example.com" }] });

      await teacherController.registerStudents(req as Request, res as Response);

      expect(studentRepository.createAndSave).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should return 500 if an error occurs", async () => {
      req.body = { teacher: "teacher@example.com", students: ["student1@example.com"] };
      (teacherRepository.findByEmail as jest.Mock).mockRejectedValue(new Error("Database error"));

      await teacherController.registerStudents(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to register students" });
    });
  });

  describe("getCommonStudents", () => {
    it("should return common students for given teachers", async () => {
      req.query = { teacher: ["teacher1@example.com", "teacher2@example.com"] };
      (studentRepository.findCommonStudents as jest.Mock).mockResolvedValue([
        { email: "student1@example.com" },
        { email: "student2@example.com" },
      ]);

      await teacherController.getCommonStudents(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ students: ["student1@example.com", "student2@example.com"] });
    });
  });

  describe("retrieveForNotifications", () => {
    it("should retrieve students for notifications", async () => {
      req.body = {
        teacher: "teacher@example.com",
        notification: "Hey @student1@example.com, check this out! @student2@example.com",
      };

      (studentRepository.findForNotifications as jest.Mock).mockResolvedValue([
        { email: "student1@example.com" },
        { email: "student2@example.com" },
      ]);

      await teacherController.retrieveForNotifications(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ recipients: ["student1@example.com", "student2@example.com"] });
    });
  });
});
