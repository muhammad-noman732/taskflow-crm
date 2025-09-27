import { prisma } from "@/config/db";
import { Request,  Response } from "express";

const addProjectMember = async( req :Request , res:Response)=>{
     try {
    //- get the current user 
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        const {projectId , role , memberId} = req.body;

        // Check authentication early
        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

    //1- Find the organization membership of user
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization"
            });
        }

        // 2- user has role(access) to create the member of project 
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions to add project member" 
      });
    }

 // 3. Verify project exists and belongs to the same organization 
    const project = await prisma.project.findFirst({ 
      where: {
        id: projectId,
        orgId : currentOrgId,
       }
     });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found" 
      });
    }
 
    // 4- check that member not already exists to same project
    const existingMember = await prisma.projectMember.findUnique({
          where:{
            projectId_userId: {
                projectId: projectId,
                userId: memberId
            }
          }
    });

    if (existingMember) {
        return res.status(409).json({
            success: false,
            message: "User is already a member of this project"
        });
    }

    // 5- Verify the user exists and is member of the organization
    const userToAdd = await prisma.user.findFirst({
        where: {
            id: memberId,
            memberships: {
                some: {
                    organizationId: currentOrgId
                }
            }
        }
    });

    if (!userToAdd) {
        return res.status(404).json({
            success: false,
            message: "User not found or not a member of this organization"
        });
    }

    // 6- add member
    const addMember = await prisma.projectMember.create({
        data: {
            role,
            projectId,
            userId: memberId
        },
        include: {
            project: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true 
                }
            }
        }
    });

    return res.status(201).json({
        success: true,
        message: "Project member added successfully",
        data: addMember
    });

     } catch (error) {
        console.error("Add project member error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
     }
};

// Get all project members
const getProjectMembers = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        // 1. Check authentication
        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // 2. Verify project exists and belongs to the same organization
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                orgId: currentOrgId,
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // 3. Get all project members
        const members = await prisma.projectMember.findMany({
            where: {
                projectId: projectId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Project members retrieved successfully",
            data: members
        });

    } catch (error) {
        console.error("Get project members error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Remove project member
const removeProjectMember = async (req: Request, res: Response) => {
    try {
        const { projectId, memberId } = req.params;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        // 1. Check authentication
        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // 2. Check permissions
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to remove project member"
            });
        }

        // 3. Remove member
        await prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId: projectId,
                    userId: memberId
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Project member removed successfully"
        });

    } catch (error) {
        console.error("Remove project member error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export { addProjectMember, getProjectMembers, removeProjectMember };