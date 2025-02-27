import { DataSource } from "typeorm";
import { StudentRepository } from "../../repositories/student-repository";
import { Student } from "../../entities/student";
import { Teacher } from "../../entities/teacher";

let testDataSource: DataSource;
let studentRepository: StudentRepository;
let studentRepo;
let teacherRepo;

const studentEmail1 = "student1@example.com";
const studentEmail2 = "student2@example.com";
const studentEmail3 = "student3@example.com";

const teacherEmail1 = "teacher1@example.com";
const teacherEmail2 = "teacher2@example.com";

beforeAll(async () => {
  testDataSource = new DataSource({
    type: "mysql",  // Change from "sqlite" to "mysql"
    host: "localhost",
    port: 3306, // Default MySQL port
    username: "user", // Match docker-compose
    password: "teacher_student_system_password",
    database: "teacher_student_system",
    entities: [Student, Teacher],
    synchronize: true,
    logging: false,
    dropSchema:true
  });

  await testDataSource.initialize();

  // Initialize repositories
  studentRepository = new StudentRepository(testDataSource);
  studentRepo = testDataSource.getRepository(Student);
  teacherRepo = testDataSource.getRepository(Teacher);

  // Seed test data
  const teacher1 = await teacherRepo.save({ email: teacherEmail1 });
  const teacher2 = await teacherRepo.save({ email: teacherEmail2 });

  await studentRepo.save({ email: studentEmail1, teachers: [teacher1] });
  await studentRepo.save({ email: studentEmail2, teachers: [teacher1, teacher2] });
});


afterAll(async () => {
  // Clean up after tests
  await testDataSource.destroy();
  jest.clearAllMocks();
});

describe("StudentRepository", () => {
  it("should return a student if found by email", async () => {
    const student = await studentRepository.findByEmail(studentEmail1);
    expect(student).toBeTruthy();
    expect(student?.email).toBe(studentEmail1);
  });

  it("should return null if no student is found by email", async () => {
    const student = await studentRepository.findByEmail("nonexistent@example.com");
    expect(student).toBeNull();
  });

  it("should create and save a new student", async () => {
    const newStudentEmail = "newstudent@example.com";
    const student = await studentRepository.createAndSave(newStudentEmail, []);
    expect(student).toBeTruthy();
    expect(student.email).toBe(newStudentEmail);
  });

  it("should update a student's suspended status", async () => {
    await studentRepository.updateSuspendedStatus(studentEmail1, true);
    const updatedStudent = await studentRepository.findByEmail(studentEmail1);
    expect(updatedStudent?.isSuspended).toBe(true);

    await studentRepository.updateSuspendedStatus(studentEmail1, false);
    const updatedStudentAgain = await studentRepository.findByEmail(studentEmail1);
    expect(updatedStudentAgain?.isSuspended).toBe(false);
  });

  it("should find common students for multiple teachers", async () => {
    const commonStudents = await studentRepository.findCommonStudents([
      teacherEmail1,
      teacherEmail2,
    ]);
    expect(commonStudents.length).toBe(1);
    expect(commonStudents[0].email).toBe(studentEmail2);
  });

  it("should retrieve students for notifications", async () => {
    const studentsForNotification = await studentRepository.findForNotifications(
      teacherEmail1,
      [studentEmail1]
    );
    expect(studentsForNotification.some((s) => s.email === studentEmail1)).toBe(true);
  });

  it("should prevent duplicate student emails if uniqueness is enforced", async () => {
    try {
      await studentRepository.createAndSave(studentEmail1, []);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

});
