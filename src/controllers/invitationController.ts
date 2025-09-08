import { prisma } from "@/config/db";
import { sendEmail } from "@/services/emailService";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";


// invite user to organization. as admin . manager . member and client of the organization

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { role, email } = req.body;

    const currentUserId = req.user?.userId;
    const currentOrgId = req.user?.organizationId;

    if (!currentUserId || !currentOrgId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
      });
    }

    // Check membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        // unique composite key constraints
        userId_organizationId: {
          userId: currentUserId,
          organizationId: currentOrgId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this organization",
      });
    }

    // Fetch org details for email
    const org = await prisma.organization.findUnique({
      where: { id: currentOrgId },
    });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    // Generate token + expiry
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create invitation
  const data=  await prisma.invitation.create({
      data: {
        email,                                            
        role,
        token,
        createdById: currentUserId,
        organizationId: currentOrgId,
        expiresAt,
      },
    });

    // Create invite link
    const inviteLink = `http://localhost:5174/accept-invite?token=${token}`;

    // Send email
    await sendEmail(
      email,
      "You're invited to join an organization",
      `<p>You have been invited as <b>${role}</b> to join <b>${org.name}</b>.
       Click <a href="${inviteLink}">here</a> to accept.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully",
      "data": data
    });
  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// accept the invitaion link

export const acceptInvitation = async(req: Request , res : Response)=>{
     try {
        const {username , password , token } = req.body;
        
        // find the invitation
        const invitation = await prisma.invitation.findUnique({
            where:{
                token
            }
        })

        
   if (!invitation) {
      return res.status(400).json({ success: false, message: "Invalid invitation" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invitation already used or expired" });
    }

    // check the expiry time 
    
    if (new Date() > invitation.expiresAt) {
         return res.status(400).json({ success: false, message: "Invitation expired" });
    }
 
   // 2. Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password required for new account",
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create new user 
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          username,
          password: hashedPassword,
        },
      });
    } else {
      // User exists, check if already a member of this organization
      const existingMembership = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId,
          },
        },
      });
      
      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this organization",
        });
      }
    }
    
       // 3. Add membership
    await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    
    // 4. Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
