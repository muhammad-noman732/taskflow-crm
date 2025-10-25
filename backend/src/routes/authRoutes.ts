import express from "express";
import { doSignup, doLogin, doLogout, verifyOtp, forgotPassword, resetPassword } from "@/controllers/authController";
import { validateRequest } from "@/middleware/validation";
import { userSchema, loginSchema, verifyOtpSchema } from "@/schemas";

const authRouter = express.Router();

// POST /auth/signup
authRouter.post("/signup", validateRequest(userSchema), doSignup);

// POST /auth/login
authRouter.post("/login", validateRequest(loginSchema), doLogin);

// POST /auth/verify-otp
authRouter.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

// POST /auth/logout
authRouter.post("/logout", doLogout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;