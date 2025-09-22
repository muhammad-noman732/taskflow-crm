import { prisma } from "@/config/db";
import { Request, Response } from "express";

// addLabelToTask()           // Add label to task
export const addLabelToTask = async (req: Request, res: Response) => {
    try {
        const { taskId, labelId } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

        // Find the memberships 
        const memberships = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!memberships) {
            return res.status(403).json({
                success: false,
                message: "Not a member of organization to assign labels",
                timestamp: new Date().toISOString()
            });
        }

        // All members can assign labels to tasks (not just managers)
        // if (!['MANAGER', 'ADMIN', 'OWNER'].includes(memberships.role)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Insufficient permissions to assign labels to task",
        //         timestamp: new Date().toISOString()
        //     });
        // }

        // Check label exists and belongs to organization
        const labelExists = await prisma.label.findFirst({
            where: {
                id: labelId,
                orgId: organizationId
            }
        });

        if (!labelExists) {
            return res.status(404).json({
                success: false,
                message: "Label not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check task exists and belongs to organization
        const taskExists = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: organizationId
                }
            }
        });

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: "Task not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if label is already assigned to task
        const taskLabelExists = await prisma.taskLabel.findUnique({
            where: {
                taskId_labelId: {
                    taskId: taskId,
                    labelId: labelId
                }
            }
        });

        if (taskLabelExists) {
            return res.status(409).json({
                success: false,
                message: "Label is already assigned to this task",
                timestamp: new Date().toISOString()
            });
        }

        // Assign the label to task
        const addLabel = await prisma.taskLabel.create({
            data: {
                taskId: taskId,
                labelId: labelId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                label: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            data: addLabel,
            message: "Label added to task successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Add label to task error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

// removeLabelFromTask()      // Remove label from task
export const removeLabelFromTask = async (req: Request, res: Response) => {
    try {
        const { taskId, labelId } = req.params;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

        // Find the memberships 
        const memberships = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!memberships) {
            return res.status(403).json({
                success: false,
                message: "Not a member of organization to remove labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if task-label relationship exists and belongs to organization
        const taskLabelExists = await prisma.taskLabel.findFirst({
            where: {
                taskId: taskId,
                labelId: labelId,
                task: {
                    project: {
                        orgId: organizationId
                    }
                }
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                label: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        if (!taskLabelExists) {
            return res.status(404).json({
                success: false,
                message: "Label-task relationship not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Remove the label from task
        await prisma.taskLabel.delete({
            where: {
                taskId_labelId: {
                    taskId: taskId,
                    labelId: labelId
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Label removed from task successfully",
            data: taskLabelExists,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Remove label from task error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

// getTaskLabels()           // Get all labels for task
export const getTaskLabels = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

        // Find the memberships 
        const memberships = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!memberships) {
            return res.status(403).json({
                success: false,
                message: "Not a member of organization to view task labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if task exists and belongs to organization
        const taskExists = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: organizationId
                }
            }
        });

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: "Task not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Get all labels for the task
        const taskLabels = await prisma.taskLabel.findMany({
            where: {
                taskId: taskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                label: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Task labels retrieved successfully",
            data: taskLabels,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get task labels error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

// bulkAssignLabels()        // Add multiple labels at once
export const bulkAssignLabels = async (req: Request, res: Response) => {
    try {
        const { taskId, labelIds } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

        // Find the memberships 
        const memberships = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!memberships) {
            return res.status(403).json({
                success: false,
                message: "Not a member of organization to assign labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if task exists and belongs to organization
        const taskExists = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: organizationId
                }
            }
        });

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: "Task not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if all labels exist and belong to organization
        const labelsExist = await prisma.label.findMany({
            where: {
                id: { in: labelIds },
                orgId: organizationId
            }
        });

        if (labelsExist.length !== labelIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more labels not found or don't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check existing task-label relationships to avoid duplicates
        const existingRelations = await prisma.taskLabel.findMany({
            where: {
                taskId: taskId,
                labelId: { in: labelIds }
            }
        });

        const existingLabelIds = existingRelations.map((rel: any) => rel.labelId);
        const newLabelIds = labelIds.filter((id: any) => !existingLabelIds.includes(id));

        if (newLabelIds.length === 0) {
            return res.status(409).json({
                success: false,
                message: "All labels are already assigned to this task",
                timestamp: new Date().toISOString()
            });
        }

        // Bulk assign new labels
        const bulkAssign = await prisma.taskLabel.createMany({
            data: newLabelIds.map((labelId: any) => ({
                taskId: taskId,
                labelId: labelId
            }))
        });

        // Get all task labels after assignment
        const allTaskLabels = await prisma.taskLabel.findMany({
            where: {
                taskId: taskId
            },
            include: {
                label: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: `Successfully assigned ${bulkAssign.count} label(s) to task`,
            data: allTaskLabels,
            assigned: bulkAssign.count,
            skipped: existingLabelIds.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Bulk assign labels error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

