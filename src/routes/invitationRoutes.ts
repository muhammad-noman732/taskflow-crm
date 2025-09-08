import express from "express";
import { inviteUser, acceptInvitation } from "@/controllers/invitationController";
import { validateRequest } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { inviteUserSchema, acceptInvitationSchema } from "@/schemas";
import { prisma } from "@/config/db";

const invitationRouter = express.Router();

// GET /api/invitations - Get all invitations (for testing)
invitationRouter.get("/", async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      include: {
        organization: true,
        createdBy: {
          select: { username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitations",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



// POST /api/invitations/invite - Send invitation
invitationRouter.post("/invite", authenticateToken, validateRequest(inviteUserSchema), inviteUser);

// POST /api/invitations/accept - Accept invitation
invitationRouter.post("/accept", validateRequest(acceptInvitationSchema), acceptInvitation);

export default invitationRouter;
