import { Request, Response } from "express";
import { prisma } from "@/config/db";

//  Create task

export const createTask = async (req: Request, res: Response) => {
    try {
    const { title, description, status = 'TODO', dueDate, projectId, assignees = [] } = req.body;
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
        orgId : currentOrgId,
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found" 
      });
    }

      
    // 4. Validate assignees (User IDs, and then find the organization should be same)
    if (assignees.length > 0) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: assignees },
        },
        include: {
          memberships: {
            where: {
              organizationId: currentOrgId
            }
          }
        }
      });

      // Check if all users are members of the organization
       const validAssignees = validUsers.filter(user => user.memberships.length > 0);
      
      if (validAssignees.length !== assignees.length) {
        return res.status(400).json({ 
                success: false,
          message: "One or more assignees are not members of this organization" 
        });
      }
    }

    
    // 5. Create task
      const task = await prisma.task.create({
       data: {
          title,
          description,
          status,
          dueDate : dueDate ? new Date(dueDate) : null,
          projectId,
          createdBy: membership.id,
         assignees:{
          create: assignees.map((userId: string) => ({
            userId: userId
          }))
         }
      },
      include: {
        project: true,
        creator:{
          include:{
            organization:true,
            user:{
              select:{
                id:true,
                username:true,
                email:true
              }
            }
          }
        },
        assignees: { 
          include: { 
              user: {
                select:{
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

 // Get all tasks
export const getAllTasks = async (req: Request, res: Response) => {
  try {
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

    // 3. Get all tasks for projects in this organization
    const tasks = await prisma.task.findMany({
      where: {
        project: {
             orgId : currentOrgId,
          }
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
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

    // 3. Get task with organization validation
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
            orgId : currentOrgId
        }
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
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task
    });
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// // Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, priority , assignees } = req.body;
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

    // 3. Check if task exists and user has permission
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
         orgId : currentOrgId
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // 4. Check permissions (creator or admin/owner/manager)
    if (existingTask.createdBy !== membership.id && !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update this task"
      });
    }
    

   
    // 5. Validate assignees if provided
    if (assignees && assignees.length > 0) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: assignees },
        },
        include: {
          memberships: {
            where: {
              organizationId: currentOrgId
            }
          }
        }
      });

      // Check if all users are members of the organization
       const validAssignees = validUsers.filter(user => user.memberships.length > 0);
      
      if (validAssignees.length !== assignees.length) {
        return res.status(400).json({ 
          success: false,
          message: "One or more assignees are not members of this organization" 
        });
      }
    }

    // 6. Update task
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        ...(assignees && {
          assignees: {
            set: assignees.map((userId: string) => ({ userId }))
          }
        })
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
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task
    });
    } catch (error) {  
    console.error("Update task error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

    // 3. Check if task exists and user has permission
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          orgId: currentOrgId
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // 4. Check permissions (creator or admin/owner/manager)
    if (existingTask.createdBy !== membership.id && !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to delete this task"
      });
    }

    // 5. Delete task
    await prisma.task.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};