 import { prisma } from "@/config/db";
import { Request, Response } from "express";

// startTimer - Start tracking time on a task
export const startTimer = async (req: Request, res: Response) => {
  try {
    const { taskId, notes, billable = true } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Input validation
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Check if task exists and user has access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { orgId: organizationId },
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or doesn't belong to this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Check if user already has an active timer for this task
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        taskId,
        userId,
        endedAt: null, // Active timer (not ended)
      },
    });

    if (activeTimer) {
      return res.status(409).json({
        success: false,
        message: "You already have an active timer for this task. Please stop it first.",
        data: activeTimer,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Create time entry (start timer)
    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startedAt: new Date(),
        endedAt: null,
        billable,
        note: notes?.trim() || null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Timer started successfully",
      data: timeEntry,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error starting timer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// stopTimer - Stop tracking and save the time
export const stopTimer = async (req: Request, res: Response) => {
  try {
    const { timeEntryId } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Input validation
    if (!timeEntryId) {
      return res.status(400).json({
        success: false,
        message: "Time entry ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Find the active time entry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        userId,
        endedAt: null, // Must be active
        task: {
          project: { orgId: organizationId }, // Must belong to user's organization
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: "Active timer not found or doesn't belong to you",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Calculate duration
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - timeEntry.startedAt.getTime();
    const minutes = Math.round(durationMs / (1000 * 60));

    // 6. Update time entry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        endedAt,
        minutes,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      data: {
        ...updatedTimeEntry,
        duration: {
          minutes,
          hours: Math.round((minutes / 60) * 100) / 100,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error stopping timer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// createTimeEntry - Manually add time (without timer)
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const { taskId, startedAt, endedAt, notes, billable = true } = req.body;
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Input validation
    if (!taskId || !startedAt || !endedAt) {
      return res.status(400).json({
        success: false,
        message: "Task ID, start time, and end time are required",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Validate dates
    const startDate = new Date(startedAt);
    const endDate = new Date(endedAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
        timestamp: new Date().toISOString(),
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Check if task exists and user has access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { orgId: organizationId },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or doesn't belong to this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Calculate duration
    const durationMs = endDate.getTime() - startDate.getTime();
    const minutes = Math.round(durationMs / (1000 * 60));

    // 7. Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startedAt: startDate,
        endedAt: endDate,
        minutes,
        billable,
        note: notes?.trim() || null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Time entry created successfully",
      data: {
        ...timeEntry,
        duration: {
          minutes,
          hours: Math.round((minutes / 60) * 100) / 100,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating time entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// getTimeEntries - Get all time entries for a user/task/project (Simplified Version)
export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    const { taskId, projectId, userId: queryUserId, startDate, endDate, billable } = req.query;
    const currentUserId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!currentUserId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: currentUserId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Check permissions (only OWNER, ADMIN, MANAGER can view all time entries)
    const canViewAll = ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);
    const targetUserId = canViewAll && queryUserId ? queryUserId as string : currentUserId;

    // 4. SIMPLE APPROACH - Get all time entries first, then filter
    let timeEntries = await prisma.timeEntry.findMany({
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                orgId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });


    // Filter by organization (security)
    timeEntries = timeEntries.filter(entry => 
      entry.task.project.orgId === organizationId
    );

    // Filter by user (permissions)
    if (targetUserId) {
      timeEntries = timeEntries.filter(entry => entry.userId === targetUserId);
    }

    // Filter by task
    if (taskId) {
      timeEntries = timeEntries.filter(entry => entry.taskId === taskId);
    }

    // Filter by project
    if (projectId) {
      timeEntries = timeEntries.filter(entry => entry.task.projectId === projectId);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      timeEntries = timeEntries.filter(entry => entry.startedAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      timeEntries = timeEntries.filter(entry => entry.startedAt <= end);
    }

    // Filter by billable
    if (billable !== undefined) {
      const isBillable = billable === 'true';
      timeEntries = timeEntries.filter(entry => entry.billable === isBillable);
    }

    // 6. Calculate totals
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0);
    const billableMinutes = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.minutes || 0), 0);

    return res.status(200).json({
      success: true,
      message: "Time entries retrieved successfully",
      data: timeEntries,
      summary: {
        totalEntries: timeEntries.length,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        billableMinutes,
        billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting time entries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// getTimeEntryById - Get single time entry by ID
export const getTimeEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!currentUserId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: currentUserId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Check permissions
    const canViewAll = ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);

    // 4. Get time entry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        task: {
          project: { orgId: organizationId },
        },
        ...(canViewAll ? {} : { userId: currentUserId }),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: "Time entry not found or doesn't belong to this organization",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time entry retrieved successfully",
      data: {
        ...timeEntry,
        duration: timeEntry.minutes ? {
          minutes: timeEntry.minutes,
          hours: Math.round((timeEntry.minutes / 60) * 100) / 100,
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting time entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// updateTimeEntry - Edit existing time entry
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startedAt, endedAt, notes, billable } = req.body;
    const currentUserId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!currentUserId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: currentUserId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Check permissions
    const canEditAll = ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);

    // 4. Find existing time entry
    const existingTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        task: {
          project: { orgId: organizationId },
        },
        ...(canEditAll ? {} : { userId: currentUserId }),
      },
    });

    if (!existingTimeEntry) {
      return res.status(404).json({
        success: false,
        message: "Time entry not found or doesn't belong to this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Build update data
    const updateData: any = {};
    if (startedAt !== undefined) updateData.startedAt = new Date(startedAt);
    if (endedAt !== undefined) updateData.endedAt = endedAt ? new Date(endedAt) : null;
    if (notes !== undefined) updateData.note = notes?.trim() || null;
    if (billable !== undefined) updateData.billable = billable;

    // 6. Recalculate minutes if times changed
    if (startedAt !== undefined || endedAt !== undefined) {
      const startTime = updateData.startedAt || existingTimeEntry.startedAt;
      const endTime = updateData.endedAt || existingTimeEntry.endedAt;
      
      if (endTime && startTime) {
        const durationMs = endTime.getTime() - startTime.getTime();
        updateData.minutes = Math.round(durationMs / (1000 * 60));
      }
    }

    // 7. Update time entry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Time entry updated successfully",
      data: {
        ...updatedTimeEntry,
        duration: updatedTimeEntry.minutes ? {
          minutes: updatedTimeEntry.minutes,
          hours: Math.round((updatedTimeEntry.minutes / 60) * 100) / 100,
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error updating time entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// deleteTimeEntry - Remove time entry
export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!currentUserId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: currentUserId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Check permissions
    const canDeleteAll = ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);

    // 4. Find existing time entry
    const existingTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        task: {
          project: { orgId: organizationId },
        },
        ...(canDeleteAll ? {} : { userId: currentUserId }),
      },
    });

    if (!existingTimeEntry) {
      return res.status(404).json({
        success: false,
        message: "Time entry not found or doesn't belong to this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Delete time entry
    await prisma.timeEntry.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Time entry deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting time entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};

// getActiveTimer - Get user's currently active timer
export const getActiveTimer = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    // 1. Authentication check
    if (!currentUserId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Validate membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: currentUserId, organizationId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this organization",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Get active timer
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: currentUserId,
        endedAt: null, // Active timer
        task: {
          project: { orgId: organizationId },
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!activeTimer) {
      return res.status(404).json({
        success: false,
        message: "No active timer found",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Calculate current duration
    const now = new Date();
    const durationMs = now.getTime() - activeTimer.startedAt.getTime();
    const currentMinutes = Math.round(durationMs / (1000 * 60));

    return res.status(200).json({
      success: true,
      message: "Active timer retrieved successfully",
      data: {
        ...activeTimer,
        currentDuration: {
          minutes: currentMinutes,
          hours: Math.round((currentMinutes / 60) * 100) / 100,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting active timer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
};