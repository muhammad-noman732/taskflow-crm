import { prisma } from "@/config/db";
import { Request, Response } from "express";

// Create dependency - Task A depends on Task B
export const createDependency = async (req: Request, res: Response) => {
    try {
        const { taskId, dependsOnTaskId } = req.body;
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
                message: "Insufficient permissions to create task dependency"
            });
        }

        // 3. Validate both tasks exist and belong to same organization
        const tasks = await prisma.task.findMany({
            where: {
                id: { in: [taskId, dependsOnTaskId] },
                project: {
                    orgId: currentOrgId
                }
            }
        });

        if (tasks.length !== 2) {
            return res.status(404).json({
                success: false,
                message: "One or both tasks not found or not in your organization"
            });
        }

        // 4. Check if dependency already exists
        const existingDependency = await prisma.taskDependency.findFirst({
            where: {
                taskId: taskId,
                dependsOnTaskId: dependsOnTaskId
            }
        });

        if (existingDependency) {
            return res.status(409).json({
                success: false,
                message: "Dependency already exists"
            });
        }

        // 5. Check for circular dependency
        const circularCheck = await checkCircularDependency(taskId, dependsOnTaskId);
        if (circularCheck) {
            return res.status(400).json({
                success: false,
                message: "Circular dependency detected - this would create an infinite loop"
            });
        }

        // 6. Create dependency
        const dependency = await prisma.taskDependency.create({
            data: {
                taskId: taskId,
                dependsOnTaskId: dependsOnTaskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                },
                dependsOn: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        // 7. Update task status if needed
        await updateTaskStatusBasedOnDependencies(taskId);

        return res.status(201).json({
            success: true,
            message: "Task dependency created successfully",
            data: dependency
        });

    } catch (error) {
        console.error("Create dependency error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Remove dependency
export const removeDependency = async (req: Request, res: Response) => {
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
                message: "Insufficient permissions to remove task dependency"
            });
        }

        // 3. Find and validate dependency
        const dependency = await prisma.taskDependency.findFirst({
            where: {
                id: id,
                task: {
                    project: {
                        orgId: currentOrgId
                    }
                }
            }
        });

        if (!dependency) {
            return res.status(404).json({
                success: false,
                message: "Dependency not found"
            });
        }

        // 4. Remove dependency
        await prisma.taskDependency.delete({
            where: { id: id }
        });

        // 5. Update task status
        await updateTaskStatusBasedOnDependencies(dependency.taskId);

        return res.status(200).json({
            success: true,
            message: "Task dependency removed successfully"
        });

    } catch (error) {
        console.error("Remove dependency error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get task dependencies (what this task depends on)
export const getTaskDependencies = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        // 1. Check authentication
        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // 2. Validate task exists and belongs to organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: currentOrgId
                }
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // 3. Get dependencies
        const dependencies = await prisma.taskDependency.findMany({
            where: {
                taskId: taskId
            },
            include: {
                dependsOn: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dueDate: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Task dependencies retrieved successfully",
            data: dependencies
        });

    } catch (error) {
        console.error("Get task dependencies error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get dependent tasks (what depends on this task)
export const getDependentTasks = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        // 1. Check authentication
        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // 2. Validate task exists and belongs to organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: currentOrgId
                }
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // 3. Get dependent tasks
        const dependentTasks = await prisma.taskDependency.findMany({
            where: {
                dependsOnTaskId: taskId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dueDate: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Dependent tasks retrieved successfully",
            data: dependentTasks
        });

    } catch (error) {
        console.error("Get dependent tasks error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Helper function: Check for circular dependency
const checkCircularDependency = async (taskId: string, dependsOnTaskId: string): Promise<boolean> => {
    // If A depends on B, check if B already depends on A (direct circular)
    const directCircular = await prisma.taskDependency.findFirst({
        where: {
            taskId: dependsOnTaskId,
            dependsOnTaskId: taskId
        }
    });

    if (directCircular) return true;

    // Check for indirect circular dependency (A→B→C→A)
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
        const currentTaskId = stack.pop()!;
        
        if (visited.has(currentTaskId)) continue;
        visited.add(currentTaskId);

        if (currentTaskId === taskId) return true;

        // Find tasks that current task depends on
        const dependencies = await prisma.taskDependency.findMany({
            where: { taskId: currentTaskId },
            select: { dependsOnTaskId: true }
        });

        for (const dep of dependencies) {
            stack.push(dep.dependsOnTaskId);
        }
    }

    return false;
};

// Helper function: Update task status based on dependencies
const updateTaskStatusBasedOnDependencies = async (taskId: string) => {
    // Get all dependencies for this task
    const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: taskId },
        include: {
            dependsOn: {
                select: { status: true }
            }
        }
    });

    // Check if all dependencies are completed
    const allDependenciesCompleted = dependencies.every(
        dep => dep.dependsOn.status === 'DONE'
    );

    // Get current task
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { status: true }
    });

    if (!task) return;

    // Update status based on dependencies
    if (allDependenciesCompleted && task.status === 'BLOCKED') {
        // All dependencies done, unblock the task
        await prisma.task.update({
            where: { id: taskId },
            data: { status: 'TODO' }
        });
    } else if (!allDependenciesCompleted && task.status !== 'BLOCKED') {
        // Some dependencies not done, block the task
        await prisma.task.update({
            where: { id: taskId },
            data: { status: 'BLOCKED' }
        });
    }
};