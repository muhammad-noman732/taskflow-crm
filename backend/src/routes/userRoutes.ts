import { getCurrentUser } from "@/controllers/userController";
import { authenticateToken } from "@/middleware/auth";
import { Router } from "express"

const userRouter = Router();
// All routes require authentication
 userRouter.use(authenticateToken);

userRouter.get('/user' , getCurrentUser)

export default userRouter