import { Router } from "express";
import { authenticateToken, authorizeRole } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import { taskSchema } from "@/schemas";
import { 
  createTask, 
  getAllTasks, 
  getTaskById, 
  updateTask, 
  deleteTask 
} from "@/controllers/taskController";

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

// Get all tasks (all authenticated users)
taskRouter.get("/", getAllTasks);

// Get task by ID (all authenticated users)
taskRouter.get("/:id", getTaskById);

// Update task (OWNER, ADMIN, MANAGER, or task creator)
taskRouter.put(
  "/:id",
  authorizeRole('OWNER', 'ADMIN', 'MANAGER', 'MEMBER'),
  updateTask
);

// Delete task (OWNER, ADMIN, MANAGER, or task creator)
taskRouter.delete(
  "/:id",
  authorizeRole('OWNER', 'ADMIN', 'MANAGER', 'MEMBER'),
  deleteTask
);

export default taskRouter;
