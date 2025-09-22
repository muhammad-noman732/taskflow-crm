import { prisma } from "@/config/db";
import { Request, Response } from "express";

// Create new label
export const createLabel = async (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;
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
                message: "Not a member of organization to create labels",
                timestamp: new Date().toISOString()
            });
        }

        if (!['MANAGER', 'ADMIN', 'OWNER'].includes(memberships.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to create labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if label name already exists in organization
        const existingLabel = await prisma.label.findFirst({
            where: {
                name: name,
                orgId: organizationId
            }
        });

        if (existingLabel) {
            return res.status(409).json({
                success: false,
                message: "Label with this name already exists in your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Create the label
        const newLabel = await prisma.label.create({
            data: {
                orgId: organizationId,
                name: name.trim(),
                color: color || "#3b82f6", // Default blue color
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tasks: {
                    select: {
                        task: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Label created successfully",
            data: newLabel,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Create label error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

// getLabels()        // Get all org labels  

export const getLabels = async (req: Request, res: Response) => {
    try {
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
                message: "Not a member of organization to view labels",
                timestamp: new Date().toISOString()
            });
        }
        
        const labels = await prisma.label.findMany({
            where: {
                orgId: organizationId,
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tasks: {
                    select: {
                        task: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return res.status(200).json({
            success: true,
            message: "Labels retrieved successfully",
            data: labels,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get labels error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};


// updateLabel()      // Update label name/color
export const updateLabel = async (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const labelId = req.params.id;

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
                message: "Not a member of organization to update labels",
                timestamp: new Date().toISOString()
            });
        }

        if (!['MANAGER', 'ADMIN', 'OWNER'].includes(memberships.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to update labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if label exists and belongs to organization
        const existingLabel = await prisma.label.findFirst({
            where: {
                id: labelId,
                orgId: organizationId
            }
        });

        if (!existingLabel) {
            return res.status(404).json({
                success: false,
                message: "Label not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if new name conflicts with existing labels (excluding current label)
        if (name && name !== existingLabel.name) {
            const nameConflict = await prisma.label.findFirst({
                where: {
                    name: name.trim(),
                    orgId: organizationId,
                    id: { not: labelId }
                }
            });

            if (nameConflict) {
                return res.status(409).json({
                    success: false,
                    message: "Label with this name already exists in your organization",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Update the label
        const updatedLabel = await prisma.label.update({
            where: {
                id: labelId
            },
            data: {
                ...(name && { name: name.trim() }),
                ...(color && { color: color })
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tasks: {
                    select: {
                        task: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Label updated successfully",
            data: updatedLabel,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Update label error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};


// deleteLabel()      // Delete label (check usage first)
export const deleteLabel = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const labelId = req.params.id;

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
                message: "Not a member of organization to delete labels",
                timestamp: new Date().toISOString()
            });
        }

        if (!['MANAGER', 'ADMIN', 'OWNER'].includes(memberships.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to delete labels",
                timestamp: new Date().toISOString()
            });
        }

        // Check if label exists and belongs to organization
        const existingLabel = await prisma.label.findFirst({
            where: {
                id: labelId,
                orgId: organizationId
            },
            include: {
                tasks: {
                    select: {
                        task: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingLabel) {
            return res.status(404).json({
                success: false,
                message: "Label not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check if label is being used by any tasks
        if (existingLabel.tasks.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete label. It is currently being used by ${existingLabel.tasks.length} task(s)`,
                data: {
                    taskCount: existingLabel.tasks.length,
                    tasks: existingLabel.tasks.map((t: any) => t.task)
                },
                timestamp: new Date().toISOString()
            });
        }

        // Delete the label
        const deletedLabel = await prisma.label.delete({
            where: {
                id: labelId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Label deleted successfully",
            data: deletedLabel,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Delete label error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
