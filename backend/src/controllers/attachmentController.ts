import { prisma } from "@/config/db";
import { deleteFromCloudinary, extractPublicId, uploadToCloudinary } from "@/services/cloudinaryService";
import { Request, Response } from "express";

// Attachments
//   'POST /api/attachments/upload': 'Upload file',

export const createAttachment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        const { projectId, taskId } = req.body;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

        const memberships = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        })

        if (!memberships) {
            return res.status(403).json({
                success: false,
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        // Validate that either taskId or projectId is provided
        if (!taskId && !projectId) {
            return res.status(400).json({
                success: false,
                message: "Either taskId or projectId is required",
                timestamp: new Date().toISOString()
            });
        }

        // Check if task exists (if taskId provided)
        if (taskId) {
            const task = await prisma.task.findFirst({
                where: {
                    id: taskId,
                    project: { orgId: organizationId }
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

        // Check if project exists (if projectId provided)
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

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
                timestamp: new Date().toISOString()
            });
        }

        // Upload file to Cloudinary
        let uploadResult;
            try {
                 uploadResult = await uploadToCloudinary(req.file.path);
                if (!uploadResult) {
                  return res.status(500).json({
                       success: false,
                    message: "File upload failed",
                    timestamp: new Date().toISOString()
                   });
               }
            } catch (error) {
                return res.status(500).json({
                       success: false,
                message: "File upload failed",
                error: error instanceof Error ? error.message : "Internal server error",
                timestamp: new Date().toISOString()
            });
        }

        // Create attachment record in database
        const newAttachment = await prisma.attachment.create({
            data: {
                orgId: organizationId,
                fileName: uploadResult.original_filename || req.file.originalname,
                 fileUrl: uploadResult.secure_url,
                size: uploadResult.bytes || req.file.size,
                mimeType: uploadResult.format || req.file.mimetype,
                 taskId: taskId || null,
                 projectId: projectId || null,
                uploaderId: userId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
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
            message: "Attachment created successfully",
            data: newAttachment,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Create attachment error:", error);
   return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
}

//   'GET /api/attachments/task/:taskId': 'Get task attachments',
export const getTaskAttachments = async (req: Request, res: Response) => {
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
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Task ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // Check if task exists and belongs to organization
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

        const taskAttachments = await prisma.attachment.findMany({
            where: {
                taskId: taskId,
                orgId: organizationId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
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
            message: "Task attachments retrieved successfully",
            data: taskAttachments,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get task attachments error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
//   'GET /api/attachments/project/:projectId': 'Get project attachments',
export const getProjectAttachments = async (req: Request, res: Response) => {
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
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // Check if project exists and belongs to organization
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

        const projectAttachments = await prisma.attachment.findMany({
            where: {
                projectId: projectId,
                orgId: organizationId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
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
            message: "Project attachments retrieved successfully",
            data: projectAttachments,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get project attachments error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

// get attachment by id 
export const getAttachment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const attachmentId = req.params.id;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

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
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        if (!attachmentId) {
            return res.status(400).json({
                success: false,
                message: "Attachment ID is required",
                timestamp: new Date().toISOString()
            });
        }

        const attachment = await prisma.attachment.findFirst({
            where: {
                id: attachmentId,
                orgId: organizationId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            message: "Attachment retrieved successfully",
            data: attachment,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get attachment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};


export const deleteAttachment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const attachmentId = req.params.id;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

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
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        if (!attachmentId) {
            return res.status(400).json({
                success: false,
                message: "Attachment ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // Find the attachment first
        const attachment = await prisma.attachment.findFirst({
            where: {
                id: attachmentId,
                orgId: organizationId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Delete the file from Cloudinary first
        try {
            const publicId = await extractPublicId(attachment.fileUrl);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (error) {
            console.error("Failed to delete from Cloudinary:", error);
            // Continue with database deletion even if Cloudinary fails
        }

        // Delete the attachment from the database
        const deletedAttachment = await prisma.attachment.delete({
            where: {
                id: attachmentId
            }
        });

        return res.status(200).json({
            success: true,
            message: "Attachment deleted successfully",
            data: deletedAttachment,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Delete attachment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};



//   'UPDATE /api/attachments/:id': 'Update attachment',

export const updateAttachment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        const attachmentId = req.params.id;
        const { fileName } = req.body;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
                timestamp: new Date().toISOString()
            });
        }

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
                message: "Not a member of organization",
                timestamp: new Date().toISOString()
            });
        }

        if (!attachmentId) {
            return res.status(400).json({
                success: false,
                message: "Attachment ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // Find the attachment first
        const attachment = await prisma.attachment.findFirst({
            where: {
                id: attachmentId,
                orgId: organizationId
            },
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found or doesn't belong to your organization",
                timestamp: new Date().toISOString()
            });
        }

        // Check permissions (only uploader or admin/manager can update)
        if (attachment.uploaderId !== userId && !['OWNER', 'ADMIN', 'MANAGER'].includes(memberships.role)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this attachment",
                timestamp: new Date().toISOString()
            });
        }

        // Prepare update data
        const updateData: any = {};

        // Update filename if provided
        if (fileName && fileName.trim()) {
            updateData.fileName = fileName.trim();
        }

        // Handle file upload if provided
        let uploadResult: any;
        if (req.file) {
            try {
                // Delete old file from Cloudinary
                if (attachment.fileUrl) {
                    const publicId = await extractPublicId(attachment.fileUrl);
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                    }
                }

                // Upload new file
                uploadResult = await uploadToCloudinary(req.file.path);
                if (!uploadResult) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to upload new file",
                        timestamp: new Date().toISOString()
                    });
                }

                updateData.fileUrl = uploadResult.secure_url;
                updateData.fileName = uploadResult.original_filename || req.file.originalname;
                updateData.size = uploadResult.bytes || req.file.size;
                updateData.mimeType = uploadResult.format || req.file.mimetype;

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload file",
                    error: error instanceof Error ? error.message : "Internal server error",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid data provided for update",
                timestamp: new Date().toISOString()
            });
        }

        // Update the attachment in database
        const updatedAttachment = await prisma.attachment.update({
            where: {
                id: attachmentId
            },
            data: updateData,
            include: {
                org: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                uploader: {
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
            message: "Attachment updated successfully",
            data: updatedAttachment,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Update attachment error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};

