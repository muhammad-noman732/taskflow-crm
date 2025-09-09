import { prisma } from "@/config/db";
import { sendEmail } from "@/services/emailService";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { createInvitedClient } from "./clientController";


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

    // Check if user is already a member of this organization
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { organizationId: currentOrgId }
        }
      }
    });

    if (existingUser && existingUser.memberships.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this organization",
      });
    }

    // Check if there's already a pending invitation for this email + organization
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: currentOrgId,
        status: "PENDING",
        expiresAt: {
        gt: new Date() // Not expired
        }
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: "A pending invitation already exists for this email. Please wait for it to be accepted or expired.",
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

    // create new user
    if (!user) {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password required for new account",
        });
      }
      
      // Check if username is already taken
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUserWithUsername) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken. Please choose a different username.",
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create new user (auto-verify since invitation was sent to verified email)
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          username,
          password: hashedPassword,
          isVerified: true, // Auto-verify invited users
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
      
      // If existing user is not verified, auto-verify them since invitation was sent to verified email
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
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


            // 4. If role is CLIENT, create client record
if (invitation.role === 'CLIENT') {
  try {
    await createInvitedClient(user.id, invitation.organizationId);
  } catch (error) {
    console.error('Failed to create invited client:', error);
    // Don't fail the invitation, just log the error
  }
}
    // 4. Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });



    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully. You can now log in.",
      data: user
    });
    // Note: Invitation status is updated to "ACCEPTED" above, 
    // and user is auto-verified so they can login immediately 
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
