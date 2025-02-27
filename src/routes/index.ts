import { Router } from "express";
import { TeacherController } from "../controllers/teacher-controller";
import { StudentController } from "../controllers/student-controller";
import { StudentRepository } from "../repositories/student-repository";
import { AppDataSource } from "../database";
import { TeacherRepository } from "../repositories/teacher-repository";

const router = Router();

const studentRepo = new StudentRepository(AppDataSource);
const teacherRepo = new TeacherRepository(AppDataSource);

const teacherController = new TeacherController(studentRepo, teacherRepo);
const studentController = new StudentController(studentRepo);

// Ensure proper binding of methods
router.post(
  "/register",
  teacherController.registerStudents.bind(teacherController)
);
router.get(
  "/commonstudents",
  teacherController.getCommonStudents.bind(teacherController)
);
router.post(
  "/suspend",
  studentController.suspendStudent.bind(studentController)
);
router.post(
  "/retrievefornotifications",
  teacherController.retrieveForNotifications.bind(teacherController)
);

export default router;
