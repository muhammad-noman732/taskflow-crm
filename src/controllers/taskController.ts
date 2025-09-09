import { Request, Response } from "express";
import { prisma } from "@/config/db";

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status = 'TODO', deadline, projectId, assigneeMembershipIds = [] } = req.body;
    const currentUserId = req.user?.userId;
    const currentOrgId = req.user?.organizationId;

    // 1. Check authentication
    if (!currentUserId || !currentOrgId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { 
          userId: currentUserId, 
          organizationId: currentOrgId
        }
      } 
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: "Not part of this organization" 
      });
    }

    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions" 
      });
    }

    // 3. Verify project exists and belongs to the same organization 
    const project = await prisma.project.findFirst({ 
      where: {
        id: projectId,
        membership: {
          organizationId: currentOrgId
        } 
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found" 
      });
    }

    // 4. Validate assignees
    if (assigneeMembershipIds.length > 0) {
      const validAssignees = await prisma.organizationMembership.findMany({
        where: {
          id: { in: assigneeMembershipIds },
          organizationId: currentOrgId,
        },
      });

      if (validAssignees.length !== assigneeMembershipIds.length) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid assignee(s)" 
        });
      }
    }

    // 5. Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        createdBy: membership.id,
        assignees: {
          connect: assigneeMembershipIds.map((id: string) => ({ id })),
        },
      },
      include: {
        project: true,
        creator: { 
          include: { 
            organization: true,
            user: { 
              select: {
                username: true,
                email: true,
                id: true
              } 
            } 
          } 
        },
        assignees: { 
          include: { 
            user: { 
              select: {
                username: true,
                email: true,
                id: true
              }
            } 
          } 
        },
      },
    });

    return res.status(201).json({ 
      success: true, 
      message: "Task created", 
      data: task 
    });
  } catch (error) {
    console.error("Task creation error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
