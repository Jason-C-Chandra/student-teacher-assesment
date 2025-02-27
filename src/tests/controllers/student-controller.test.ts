import { Request, Response } from "express";
import { StudentRepository } from "../../repositories/student-repository";
import { DataSource, UpdateResult } from "typeorm";
import { StudentController } from "../../controllers/student-controller";

// Mock DataSource (needed for StudentRepository)
const mockDataSource = {} as DataSource;

// Mock StudentRepository
jest.mock("../../repositories/student-repository");

let studentRepository: jest.Mocked<StudentRepository>;
let studentController: StudentController;

describe("StudentController", () => {
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

    studentRepository.findByEmail = jest.fn();

    // Ensure StudentController accepts StudentRepository
    studentController = new StudentController(studentRepository);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  describe("suspendStudent", () => {
    it("should suspend the student successfully", async () => {
      // Arrange
      const req = {
        body: { student: "student@example.com" },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      studentRepository.findByEmail.mockResolvedValue({
        email: "student@example.com",
        id: "",
        isSuspended: false,
        teachers: [],
      }); // Mock student exists
      studentRepository.updateSuspendedStatus.mockResolvedValue({
        affected: 1, // Simulating 1 row being updated
      } as UpdateResult);

      // Act
      await studentController.suspendStudent(req, res);

      // Assert
      expect(studentRepository.findByEmail).toHaveBeenCalledWith(
        "student@example.com"
      );
      expect(studentRepository.updateSuspendedStatus).toHaveBeenCalledWith(
        "student@example.com",
        true
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 400 if the student is not found", async () => {
      // Arrange
      const req = {
        body: { student: "nonexistent@example.com" },
      } as Request;
    
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    
      studentRepository.findByEmail.mockResolvedValue(null); // Simulate student not found
    
      // Act
      await studentController.suspendStudent(req, res);
    
      // Assert
      expect(studentRepository.findByEmail).toHaveBeenCalledWith("nonexistent@example.com");
      expect(studentRepository.updateSuspendedStatus).not.toHaveBeenCalled(); // Ensure update was not attempted
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to find student with that email" });
    });
    

    it("should return a 500 error if an exception occurs", async () => {
      // Arrange
      const req = {
        body: { student: "student@example.com" },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock updateSuspendedStatus to throw an error
      studentRepository.updateSuspendedStatus.mockRejectedValue(
        new Error("Some error")
      );

      studentRepository.findByEmail.mockResolvedValue({
        email: "student@example.com",
        id: "",
        isSuspended: false,
        teachers: [],
      }); // Mock student exists

      // Act
      await studentController.suspendStudent(req, res);

      // Assert
      expect(studentRepository.updateSuspendedStatus).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to suspend student",
      });
    });
  });
});
