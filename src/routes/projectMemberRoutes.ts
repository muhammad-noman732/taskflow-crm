import { Router } from "express";
import { authenticateToken, authorizeRole } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import { addProjectMemberSchema, projectMemberParamsSchema } from "@/schemas";
import { 
  addProjectMember, 
  getProjectMembers, 
  removeProjectMember 
} from "@/controllers/projectMemberController";

const projectMemberRouter = Router();

// All routes require authentication
projectMemberRouter.use(authenticateToken);

// Add project member (OWNER, ADMIN, MANAGER only)
projectMemberRouter.post(
  "/addMember",
  validateRequest(addProjectMemberSchema),
  authorizeRole('OWNER', 'ADMIN', 'MANAGER'),
  addProjectMember
);

// Get all project members (all authenticated users)
projectMemberRouter.get(
  "/:projectId",
  getProjectMembers
);

// Remove project member (OWNER, ADMIN, MANAGER only)
projectMemberRouter.delete(
  "/:projectId/:memberId",
  validateRequest(projectMemberParamsSchema),
  authorizeRole('OWNER', 'ADMIN', 'MANAGER'),
  removeProjectMember
);

export default projectMemberRouter;
