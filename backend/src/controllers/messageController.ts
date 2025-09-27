import { prisma } from "@/config/db";
import { Request, Response } from "express";

// POST /api/channels/:id/messages - Send message
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const { body } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        
        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: 'User not found or organization not found'
            });
        }

        // Validate input
        if (!body || body.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message body is required'
            });
        }

        // Check user membership in organization
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Check if channel exists and belongs to organization
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: organizationId
            }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found or does not belong to this organization'
            });
        }

        // Security: Only channel members can send messages
        const channelMember = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: channelId,
                    userId: userId
                }
            }
        });

        if (!channelMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this channel"
            });
        }

        // Create message with channelId, senderId, content
        const message = await prisma.message.create({
            data: {
                channelId: channelId,
                senderId: userId,
                body: body.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        // Response: Return message with sender details
        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// GET /api/channels/:id/messages - Get messages (paginated)
export const getMessages = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const { limit = '20', cursor, direction = 'before' } = req.query;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        
        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: 'User not found or organization not found'
            });
        }

        // Parse limit
        const messageLimit = Math.min(parseInt(limit as string) || 20, 100);

        // Check user membership in organization
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Check if channel exists and belongs to organization
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: organizationId
            }
        });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found or does not belong to this organization'
            });
        }

        // Security: Only channel members can read messages
        const channelMember = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: channelId,
                    userId: userId
                }
            }
        });

        if (!channelMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this channel"
            });
        }

        // Build where clause for pagination
        const whereClause: any = {
            channelId: channelId
        };

        // Cursor-based pagination
        if (cursor) {
            if (direction === 'before') {
                whereClause.createdAt = { lt: new Date(cursor as string) };
            } else {
                whereClause.createdAt = { gt: new Date(cursor as string) };
            }
        }

        // Get paginated messages with sender info
        const messages = await prisma.message.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: direction === 'before' ? 'desc' : 'asc'
            },
            take: messageLimit + 1 // Get one extra to check if there are more
        });

        // Check if there are more messages
        const hasMore = messages.length > messageLimit;
        const returnMessages = hasMore ? messages.slice(0, messageLimit) : messages;

        // Get cursor for next page
        const nextCursor = returnMessages.length > 0 
            ? returnMessages[returnMessages.length - 1].createdAt.toISOString()
            : null;

        return res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: {
                messages: returnMessages,
                pagination: {
                    hasMore,
                    nextCursor,
                    limit: messageLimit,
                    direction
                }
            }
        });

    } catch (error) {
        console.error('Error getting messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// PATCH /api/messages/:id - Edit message (only sender)
export const updateMessage = async (req: Request, res: Response) => {
    try {
        const messageId = req.params.id;
        const { body } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: 'User not found or organization not found'
            });
        }

        // Validate input
        if (!body || body.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message body is required'
            });
        }

        // Check if message exists and user is the sender
        const existingMessage = await prisma.message.findFirst({
            where: {
                id: messageId,
                senderId: userId
            },
            include: {
                channel: {
                    select: {
                        orgId: true
                    }
                }
            }
        });

        if (!existingMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you are not the sender'
            });
        }

        // Verify message belongs to user's organization
        if (existingMessage.channel.orgId !== organizationId) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Update message
        const updatedMessage = await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                body: body.trim()
            },
            include: {
                sender: {
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
            message: 'Message updated successfully',
            data: updatedMessage
        });

    } catch (error) {
        console.error('Error updating message:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// DELETE /api/messages/:id - Delete message (only sender/admin)
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const messageId = req.params.id;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: 'User not found or organization not found'
            });
        }

        // Check user membership and role
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Check if message exists
        const existingMessage = await prisma.message.findFirst({
            where: {
                id: messageId
            },
            include: {
                channel: {
                    select: {
                        orgId: true
                    }
                },
                sender: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });

        if (!existingMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Verify message belongs to user's organization
        if (existingMessage.channel.orgId !== organizationId) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Permission check: Only sender or admins can delete
        const isMessageSender = existingMessage.senderId === userId;
        const isAdmin = ['OWNER', 'ADMIN'].includes(membership.role);

        if (!isMessageSender && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages or need admin permissions'
            });
        }

        // Delete message
        await prisma.message.delete({
            where: {
                id: messageId
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
            data: {
                deletedMessage: {
                    id: existingMessage.id,
                    sender: existingMessage.sender.username
                }
            }
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};