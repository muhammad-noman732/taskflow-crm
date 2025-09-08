import { createProject, deleteProjectById, getAllProject, getProjectById, updateProjectById } from "@/controllers/projectController";
import { authenticateToken } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import { projectSchema } from "@/schemas";
import express from "express";

const projectRouter = express.Router()



projectRouter.post("/createProject", authenticateToken, validateRequest(projectSchema), createProject);
projectRouter.get("/", authenticateToken, getAllProject);
projectRouter.get("/:id", authenticateToken, getProjectById);
projectRouter.put("/update/:id", authenticateToken,validateRequest(projectSchema), updateProjectById)



export default projectRouter