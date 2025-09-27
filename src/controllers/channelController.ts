import { prisma } from "@/config/db";
import { Request, Response } from "express";

// POST   /api/channels              // Create channel
export const createChannel = async (req: Request, res: Response) => {
    try {
        const { name, type, projectId, taskId } = req.body;
        const userId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        
        if (!userId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: "Name and type are required"
            });
        }

        // Check user permissions
             const membership = await prisma.organizationMembership.findUnique({
               where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: currentOrgId,
               },
            },
          });
     
        if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
           return res.status(403).json({
             success: false,
                message: "Insufficient permissions to create channel",
            });
        }

        // Validate type-specific requirements and relationships
        if (type === 'PROJECT' && !projectId) {
            return res.status(400).json({
                success: false,
                message: "projectId is required for PROJECT type channels"
            });
        }

        if (type === 'TASK' && !taskId) {
            return res.status(400).json({
                success: false,
                message: "taskId is required for TASK type channels"
            });
        }

        // If projectId is provided, verify project exists and user has access
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    orgId: currentOrgId
                }
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found"
                });
            }
        }

        // If taskId is provided, verify task exists and user has access
        if (taskId) {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    project: {
                        orgId: currentOrgId
                    }
                },
                include: {
                    project: true
                }
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found"
                });
            }

            // For TASK channels, auto-set projectId from the task
            if (type === 'TASK' && !projectId) {
                // This will be used in the create data below
            }
        }

        // Create channel with creator as first member
        const newChannel = await prisma.channel.create({
            data: {
                orgId: currentOrgId,
                name,
                type,
                projectId: projectId || null,
                taskId: taskId || null,
                members: {
                    create: {
                        userId: userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                        projectId: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Channel created successfully",
            data: newChannel
        });

    } catch (error) {
        console.error("Error creating channel:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET    /api/channels              // List user's channels 
export const getChannels = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        const { projectId, taskId, type } = req.query;
        
        if (!userId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check user membership
             const membership = await prisma.organizationMembership.findUnique({
               where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: currentOrgId,
               },
            },
          });
     
         if (!membership) {
           return res.status(403).json({
             success: false,
                message: "Insufficient permissions",
            });
        }

        // Build where clause
        const whereClause: any = {
            orgId: currentOrgId,
            members: {
                some: {
                    userId: userId
                }
            }
        };

        // Add filters if provided
        if (projectId) {
            whereClause.projectId = projectId as string;
        }
        if (taskId) {
            whereClause.taskId = taskId as string;
        }
        if (type) {
            whereClause.type = type as string;
        }

        // Get channels where user is a member
        const userChannels = await prisma.channel.findMany({
            where: whereClause,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1, // Get latest message only
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true
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
            message: "Channels retrieved successfully",
            data: userChannels
        });

    } catch (error) {
        console.error("Error getting channels:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// GET    /api/channels/:id          // Get channel details
export const getChannelById = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const userId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        
        if (!userId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check if user is member of this channel
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId,
                members: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Channel retrieved successfully",
            data: channel
        });

    } catch (error) {
        console.error("Error getting channel:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PATCH  /api/channels/:id          // Update channel
export const updateChannel = async (req: Request, res: Response) => {
    try {
        const { name, type } = req.body;
        const channelId = req.params.id;
        const userId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        
        if (!userId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check user permissions
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to update channel",
            });
        }

        // Check if channel exists and belongs to organization
        const existingChannel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId
            }
        });

        if (!existingChannel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found"
            });
        }

        // Build update data
        const updateData: any = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
        }

        const updatedChannel = await prisma.channel.update({
            where: {
                id: channelId,
            },
            data: updateData,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Channel updated successfully",
            data: updatedChannel
        });

    } catch (error) {
        console.error("Error updating channel:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// DELETE /api/channels/:id          // Archive channel
export const deleteChannel = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const userId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;
        
        if (!userId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check user permissions (only OWNER and ADMIN can delete channels)
             const membership = await prisma.organizationMembership.findUnique({
               where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: currentOrgId,
               },
            },
          });
     
         if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
           return res.status(403).json({
             success: false,
                message: "Insufficient permissions to delete channel",
            });
        }

        // Check if channel exists and belongs to organization
        const existingChannel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId
            }
        });

        if (!existingChannel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found"
            });
        }

        // Delete channel (this will cascade delete members and messages)
        await prisma.channel.delete({
            where: {
                id: channelId
            }
        });

        return res.status(200).json({
            success: true,
            message: "Channel deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting channel:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};