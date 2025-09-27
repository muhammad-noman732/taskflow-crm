import { prisma } from "@/config/db";
import { Request, Response } from "express";

// 'POST /api/comments': 'Create comment',

export const createComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        // Get the validated data from body 
        const { projectId, taskId, body } = req.body;

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
                message: "Not a member of organization to create comment",
                timestamp: new Date().toISOString()
            });
        }

        // Validate project exists and belongs to organization
        if (projectId) {
        const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    orgId: organizationId
            }
            });

            if (!project) {
            return res.status(404).json({
                success: false,
                    message: "Project not found or doesn't belong to your organization",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Validate task exists and belongs to organization
        if (taskId) {
           const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    project: {
                        orgId: organizationId
                    }
                }
            });

            if (!task) {
            return res.status(404).json({
                success: false,
                    message: "Task not found or doesn't belong to your organization",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Now create comment 
        const newComment = await prisma.comment.create({
            data: {
                projectId: projectId || null,
                taskId: taskId || null,
                body: body.trim(),
                authorId: userId
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                author: {
                    select: {
                        username: true,
                        email: true,
                        id: true
                    }
                }
            }
        });
    
        return res.status(201).json({
            success: true,
            data: newComment,
            message: "Comment created successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Create comment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

//   'GET /api/comments/task/:taskId': 'Get task comments',

export const getTaskComments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const taskId = req.params.id;

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
                message: "Not a member of organization to view comments",
                timestamp: new Date().toISOString()
            });
        }

        // Validate task exists and belongs to organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    orgId: organizationId
                }
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Get task comments
        const taskComments = await prisma.comment.findMany({
            where: {
                taskId: taskId
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                author: {
                    select: {
                        username: true,
                        email: true,
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: taskComments,
            message: "Task comments retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get task comments error:", error);
         return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};



//   'GET /api/comments/project/:projectId': 'Get project comments'

export const getProjectComments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const projectId = req.params.id;

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
                message: "Not a member of organization to view comments",
                timestamp: new Date().toISOString()
            });
        }

        // Validate project exists and belongs to organization
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                orgId: organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Get all comments of project
        const projectComments = await prisma.comment.findMany({
            where: {
                projectId: projectId
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                author: {
                    select: {
                        username: true,
                        email: true,
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: projectComments,
            message: "Project comments retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get project comments error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};


//   'PUT /api/comments/:id': 'Update comment',
export const updateComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const commentId = req.params.id;

        // Get the validated data from body (only body can be updated)
        const { body } = req.body;

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
                message: "Not a member of organization to update comments",
                timestamp: new Date().toISOString()
            });
        }

        // Check that comment exists and belongs to user's organization
        const existingComment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                OR: [
                    {
                        project: {
                            orgId: organizationId
                        }
                    },
                    {
                        task: {
                            project: {
                                orgId: organizationId
                            }
                        }
                    }
                ]
            },
            include: {
                author: true
            }
        });

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if user is the author or has admin/manager permissions
        const canEdit = existingComment.authorId === userId || 
                       ['OWNER', 'ADMIN', 'MANAGER'].includes(memberships.role);

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own comments",
                timestamp: new Date().toISOString()
            });
        }

        // Update comment 
        const updatedComment = await prisma.comment.update({
            where: {
                id: commentId
            },
            data: {
                body: body.trim(),
                editedAt: new Date()
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                author: {
                    select: {
                        username: true,
                        email: true,
                        id: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            data: updatedComment,
            message: "Comment updated successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Update comment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};


//   'DELETE /api/comments/:id': 'Delete comment', 

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const commentId = req.params.id;

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
                message: "Not a member of organization to delete comments",
                timestamp: new Date().toISOString()
            });
        }

        // Check that comment exists and belongs to user's organization
        const existingComment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                OR: [
                    {
                        project: {
                            orgId: organizationId
                        }
                    },
                    {
                        task: {
                            project: {
                                orgId: organizationId
                            }
                        }
                    }
                ]
            },
            include: {
                author: true
            }
        });

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if user is the author or has admin/manager permissions
        const canDelete = existingComment.authorId === userId || 
                        ['OWNER', 'ADMIN', 'MANAGER'].includes(memberships.role);

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comments",
                timestamp: new Date().toISOString()
            });
        }

        // Delete comment
        const deletedComment = await prisma.comment.delete({
            where: {
                id: commentId
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                author: {
                    select: {
                        username: true,
                        email: true,
                        id: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            data: deletedComment,
            message: "Comment deleted successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Delete comment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};