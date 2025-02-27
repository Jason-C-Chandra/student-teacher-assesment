
import { Request, Response } from "express";
import { StudentRepository } from "../../repositories/student-repository";
import { TeacherRepository } from "../../repositories/teacher-repository";
import { DataSource } from "typeorm";
import { StudentController } from "../../controllers/student-controller";
import { TeacherController } from "../../controllers/teacher-controller";

// Mock DataSource (needed for StudentRepository)
const mockDataSource = {} as DataSource;

// Mock StudentRepository
jest.mock("../../repositories/student-repository");
jest.mock("../../repositories/teacher-repository");

let studentRepository: jest.Mocked<StudentRepository>;
let studentController: StudentController;

let teacherRepository: jest.Mocked<TeacherRepository>;
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

    // Pass mockDataSource to avoid constructor errors
    studentRepository = new StudentRepository(
      mockDataSource
    ) as jest.Mocked<StudentRepository>;
    studentRepository.updateSuspendedStatus = jest.fn();


    // Pass mockDataSource to avoid constructor errors
    teacherRepository = new TeacherRepository(
      mockDataSource
    ) as jest.Mocked<TeacherRepository>;

    studentRepository.updateSuspendedStatus = jest.fn();
    teacherRepository.findByEmail = jest.fn();
    teacherRepository.createAndSave = jest.fn();

    // Ensure StudentController accepts StudentRepository
    studentController = new StudentController(studentRepository);

    teacherController = new TeacherController(
      studentRepository,
      teacherRepository
    );
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

      // Mock the methods from TeacherRepository and StudentRepository
      (teacherRepository.findByEmail as jest.Mock).mockResolvedValue(null); // Teacher not found
      (teacherRepository.createAndSave as jest.Mock).mockResolvedValue({
        email: "teacher@example.com",
      });

      // Mock for students not found in the repository
      (studentRepository.findByEmail as jest.Mock)
        .mockResolvedValueOnce(null) // student1 not found
        .mockResolvedValueOnce(null); // student2 not found

      (studentRepository.createAndSave as jest.Mock)
        .mockResolvedValueOnce({ email: "student1@example.com", teachers: [] })
        .mockResolvedValueOnce({ email: "student2@example.com", teachers: [] });

      await teacherController.registerStudents(req as Request, res as Response);

      // Check TeacherRepository calls
      expect(teacherRepository.findByEmail).toHaveBeenCalledWith(
        "teacher@example.com"
      );
      expect(teacherRepository.createAndSave).toHaveBeenCalledWith(
        "teacher@example.com"
      );

      // Check if StudentRepository.findByEmail is called for each student
      expect(studentRepository.findByEmail).toHaveBeenCalledWith(
        "student1@example.com"
      );
      expect(studentRepository.findByEmail).toHaveBeenCalledWith(
        "student2@example.com"
      );

      // Check if StudentRepository.createAndSave is called for each student
      expect(studentRepository.createAndSave).toHaveBeenCalledTimes(2);
      expect(studentRepository.createAndSave).toHaveBeenCalledWith(
        "student1@example.com",
        [{ email: "teacher@example.com" }]
      );
      expect(studentRepository.createAndSave).toHaveBeenCalledWith(
        "student2@example.com",
        [{ email: "teacher@example.com" }]
      );

      // Check the response status
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should update the student's teachers if the student exists", async () => {
      req.body = {
        teacher: "teacher@example.com",
        students: ["student1@example.com", "student2@example.com"],
      };

      // Mock TeacherRepository and StudentRepository for existing data
      (teacherRepository.findByEmail as jest.Mock).mockResolvedValue({
        email: "teacher@example.com",
      });

      // Mock for students existing in the repository
      (studentRepository.findByEmail as jest.Mock)
        .mockResolvedValueOnce({ email: "student1@example.com", teachers: [] }) // student1 exists
        .mockResolvedValueOnce({
          email: "student2@example.com",
          teachers: [{ email: "teacher1@example.com" }],
        }); // student2 exists with existing teacher

      // Mock StudentRepository.createAndSave to only be called for student2 when updating teachers
      (studentRepository.createAndSave as jest.Mock)
        .mockResolvedValueOnce({
          email: "student1@example.com",
          teachers: [{ email: "teacher@example.com" }],
        }) // After adding teacher1 to student1
        .mockResolvedValueOnce({
          email: "student2@example.com",
          teachers: [
            { email: "teacher1@example.com" },
            { email: "teacher@example.com" },
          ],
        }); // student2 with updated teachers

      await teacherController.registerStudents(req as Request, res as Response);

      // Check TeacherRepository calls
      expect(teacherRepository.findByEmail).toHaveBeenCalledWith(
        "teacher@example.com"
      );

      // Check StudentRepository.findByEmail for each student
      expect(studentRepository.findByEmail).toHaveBeenCalledWith(
        "student1@example.com"
      );
      expect(studentRepository.findByEmail).toHaveBeenCalledWith(
        "student2@example.com"
      );

      // Check if StudentRepository.createAndSave was called to update student1 and student2
      expect(studentRepository.createAndSave).toHaveBeenCalledTimes(2);
      expect(studentRepository.createAndSave).toHaveBeenCalledWith(
        "student1@example.com",
        [{ email: "teacher@example.com" }]
      );
      expect(studentRepository.createAndSave).toHaveBeenCalledWith(
        "student2@example.com",
        [{ email: "teacher1@example.com" }, { email: "teacher@example.com" }]
      );

      // Check the response status
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should return 500 if an error occurs", async () => {
      req.body = {
        teacher: "teacher@example.com",
        students: ["student1@example.com"],
      };

      // Simulate an error in the repository method
      (teacherRepository.findByEmail as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await teacherController.registerStudents(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to register students",
      });
    });
  });

  describe("getCommonStudents", () => {
    it("should return common students for the given teachers", async () => {
      req.query = { teacher: ["teacher1@example.com", "teacher2@example.com"] };

      const mockStudents = [
        { email: "student1@example.com" },
        { email: "student2@example.com" },
      ];

      // Mock the method from StudentRepository
      (studentRepository.findCommonStudents as jest.Mock).mockResolvedValue(
        mockStudents
      );

      await teacherController.getCommonStudents(
        req as Request,
        res as Response
      );

      expect(studentRepository.findCommonStudents).toHaveBeenCalledWith([
        "teacher1@example.com",
        "teacher2@example.com",
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        students: ["student1@example.com", "student2@example.com"],
      });
    });


    it("should return students for a single teacher", async () => {
      req.query = { teacher: "teacher1@example.com" };

      const mockStudents = [
        { email: "student1@example.com" },
        { email: "student3@example.com" },
      ];

      // Mock the method from StudentRepository
      (studentRepository.findCommonStudents as jest.Mock).mockResolvedValue(
        mockStudents
      );

      await teacherController.getCommonStudents(
        req as Request,
        res as Response
      );

      expect(studentRepository.findCommonStudents).toHaveBeenCalledWith([
        "teacher1@example.com",
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        students: ["student1@example.com", "student3@example.com"],
      });
    });


    it("should return 500 if an error occurs", async () => {
      req.query = { teacher: ["teacher@example.com"] };

      // Simulate an error in the repository method
      (studentRepository.findCommonStudents as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await teacherController.getCommonStudents(
        req as Request,
        res as Response
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error getting list of common students",
      });
    });
  });

  describe("retrieveForNotifications", () => {
    it("should retrieve students for notifications", async () => {
      req.body = {
        teacher: "teacher@example.com",
        notification:
          "Hey @student1@example.com, please check this out! @student2@example.com",
      };

      const mockStudents = [
        { email: "student1@example.com" },
        { email: "student2@example.com" },
      ];

      // Mock the method from StudentRepository
      (studentRepository.findForNotifications as jest.Mock).mockResolvedValue(
        mockStudents
      );

      await teacherController.retrieveForNotifications(
        req as Request,
        res as Response
      );

      expect(studentRepository.findForNotifications).toHaveBeenCalledWith(
        "teacher@example.com",
        ["student1@example.com", "student2@example.com"]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        recipients: ["student1@example.com", "student2@example.com"],
      });
    });

    it("should return 500 if an error occurs", async () => {
      req.body = {
        teacher: "teacher@example.com",
        notification: "Check this out @student1@example.com",
      };

      // Simulate an error in the repository method
      (studentRepository.findForNotifications as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await teacherController.retrieveForNotifications(
        req as Request,
        res as Response
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error retrieving notification recipients",
      });
    });

    it("should return 400 if notification is missing", async () => {
      req.body = {
        teacher: "teacher@example.com",
        // Missing notification field
      };

      await teacherController.retrieveForNotifications(
        req as Request,
        res as Response
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Notification content is required",
      });
    });

    it("should return 400 if notification fails regex validation", async () => {
      req.body = {
        teacher: "teacher@example.com",
        notification: "Hey @invalid-email, please check this out!",
      };

      // Mock the method from StudentRepository (not used here, but necessary to avoid errors)
      (studentRepository.findForNotifications as jest.Mock).mockResolvedValue(
        []
      );

      await teacherController.retrieveForNotifications(
        req as Request,
        res as Response
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No emails found in notification",
      });
    });
  });
});