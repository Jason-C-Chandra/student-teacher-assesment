import { DataSource } from "typeorm";
import { TeacherRepository } from "../../repositories/teacher-repository";
import { Teacher } from "../../entities/teacher";
import { Student } from "../../entities/student";

let testDataSource: DataSource;
let teacherRepository: TeacherRepository;
let repo;

const teacherEmail1 = "teacher1@example.com";
const teacherEmail2 = "teacher2@example.com";

beforeAll(async () => {
  // Create an in-memory SQLite database for testing
  testDataSource = new DataSource({
    type: "mysql", // Change from "sqlite" to "mysql"
    host: "localhost",
    port: 3306, // Default MySQL port
    username: "user", // Match docker-compose
    password: "teacher_student_system_password",
    database: "teacher_student_system",
    entities: [Student, Teacher],
    synchronize: true,
    logging: false,
    dropSchema: true,
  });

  await testDataSource.initialize();

  // Initialize the repository
  teacherRepository = new TeacherRepository(testDataSource);
  repo = testDataSource.getRepository(Teacher);

  // Seed test data
  await repo.insert({ email: teacherEmail1 });
  await repo.insert({ email: teacherEmail2 });
});

afterAll(async () => {
  // Clean up after tests
  await testDataSource.destroy();
   jest.clearAllMocks();
});

describe("TeacherRepository", () => {
  it("should return a teacher if found by email", async () => {
    const teacher = await teacherRepository.findByEmail(teacherEmail1);
    expect(teacher).toBeTruthy();
    expect(teacher?.email).toBe(teacherEmail1);
  });

  it("should return null if no teacher is found by email", async () => {
    const teacher = await teacherRepository.findByEmail(
      "nonexistent@example.com"
    );
    expect(teacher).toBeNull();
  });

  it("should create and save a new teacher", async () => {
    const newTeacherEmail = "newteacher@example.com";
    const teacher = await teacherRepository.createAndSave(newTeacherEmail);
    expect(teacher).toBeTruthy();
    expect(teacher.email).toBe(newTeacherEmail);
  });

  it("should retrieve all teachers", async () => {
    const teachers = await repo.find();
    expect(teachers.length).toBeGreaterThanOrEqual(2);
  });

  it("should prevent duplicate teacher emails if uniqueness is enforced", async () => {
    const duplicateTeacherEmail = teacherEmail1;
    try {
      await teacherRepository.createAndSave(duplicateTeacherEmail);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should delete a teacher by email", async () => {
    const teacher = await teacherRepository.findByEmail(teacherEmail2);
    expect(teacher).toBeTruthy();

    await repo.delete({ email: teacherEmail2 });

    const deletedTeacher = await teacherRepository.findByEmail(teacherEmail2);
    expect(deletedTeacher).toBeNull();
  });

  it("should update a teacher's email", async () => {
    const updatedEmail = "updatedteacher@example.com";
    const teacher = await teacherRepository.findByEmail(teacherEmail1);
    expect(teacher).toBeTruthy();

    teacher.email = updatedEmail;
    await repo.save(teacher);

    const updatedTeacher = await teacherRepository.findByEmail(updatedEmail);
    expect(updatedTeacher).toBeTruthy();
    expect(updatedTeacher.email).toBe(updatedEmail);
  });
});
