import { Router } from "express";
import { authenticateToken, authorizeRole } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import { taskSchema } from "@/schemas";
import { createTask } from "@/controllers/taskController";

const taskRouter = Router();

// All routes require authentication
taskRouter.use(authenticateToken);

// Create task (OWNER, ADMIN, MANAGER only)
taskRouter.post(
  "/create",
  validateRequest(taskSchema),
  authorizeRole('OWNER', 'ADMIN', 'MANAGER'),
  createTask
);

export default taskRouter;
