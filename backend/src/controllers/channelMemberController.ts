import { prisma } from "@/config/db";
import { Request, Response } from "express";

// POST   /api/channels/:id/members     // Add member(s) to channel
export const addChannelMembers = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id; 
        const { userIds } = req.body; // Array of user IDs to add
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        if (!currentOrgId || !currentUserId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "userIds array is required and cannot be empty"
            });
        }

        // Check user permissions
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId
                }
            }
        });

        if (!membership || !['ADMIN', 'MANAGER', 'OWNER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to add members to channel"
            });
        }

        // Check if channel exists and belongs to organization
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId
            }
        });

        if (!channel) {
               return res.status(404).json({
                success: false,
                message: "Channel not found or does not belong to this organization"
            });
        }

        // Validate all users exist and are organization members
        const validMembers = await prisma.organizationMembership.findMany({
      where: {
                userId: { in: userIds },
                organizationId: currentOrgId
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

    if (validMembers.length !== userIds.length) {
            const foundUserIds = validMembers.map(m => m.userId);
            const invalidUserIds = userIds.filter(id => !foundUserIds.includes(id));
            return res.status(400).json({
                success: false,
                message: `Some users are not members of this organization: ${invalidUserIds.join(', ')}`
            });
        }

        // Check for existing memberships
        const existingMembers = await prisma.channelMember.findMany({
            where: {
                    channelId: channelId,
                    userId: { in: userIds }
            }
        });

        const existingUserIds = existingMembers.map(m => m.userId);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

        if (newUserIds.length === 0) {
    return res.status(409).json({
        success: false,
                message: "All specified users are already members of this channel"
            });
        }

        // Add new members
        const newMembers = await prisma.channelMember.createMany({
            data: newUserIds.map(userId => ({
                channelId: channelId,
                userId: userId
            }))
        });

        // Get the created members with user details
        const createdMembers = await prisma.channelMember.findMany({
            where: {
                channelId: channelId,
                userId: { in: newUserIds }
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

        return res.status(201).json({
            success: true,
            message: `Successfully added ${newMembers.count} member(s) to channel`,
            data: {
                addedMembers: createdMembers,
                skippedMembers: existingUserIds.length > 0 ? existingUserIds : []
            }
        });

    } catch (error) {
        console.error("Error adding channel members:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// DELETE /api/channels/:id/members/:userId  // Remove member from channel
export const removeChannelMember = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const userIdToRemove = req.params.userId;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        if (!currentOrgId || !currentUserId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check user permissions
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
                message: "Insufficient permissions"
            });
        }

        // Check if channel exists and belongs to organization
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId
            }
        });

        if (!channel) {
               return res.status(404).json({
                success: false,
                message: "Channel not found or does not belong to this organization"
            });
        }

        // Check if the member to remove exists in the channel
        const channelMember = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: channelId,
                    userId: userIdToRemove
                }
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

        if (!channelMember) {
               return res.status(404).json({
                success: false,
                message: "User is not a member of this channel"
            });
        }

        // Permission check: Only admins can remove others, or users can remove themselves
        const isAdmin = ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role);
        const isRemovingSelf = currentUserId === userIdToRemove;

        if (!isAdmin && !isRemovingSelf) {
            return res.status(403).json({
                success: false,
                message: "You can only remove yourself from the channel or need admin permissions"
            });
        }

        // Remove the member from the channel
        await prisma.channelMember.delete({
            where: {
                channelId_userId: {
                    channelId: channelId,
                    userId: userIdToRemove
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: `Successfully removed ${channelMember.user.username} from channel`,
            data: {
                removedMember: channelMember.user
            }
        });

    } catch (error) {
        console.error("Error removing channel member:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET    /api/channels/:id/members     // List channel members
export const getChannelMembers = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.id;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        if (!currentOrgId || !currentUserId) {
            return res.status(401).json({
                success: false,
                message: "User not found or organization not found"
            });
        }

        // Check user permissions
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
                message: "Insufficient permissions"
            });
        }

        // Check if channel exists and belongs to organization
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                orgId: currentOrgId
            }
        });

        if (!channel) {
               return res.status(404).json({
                success: false,
                message: "Channel not found or does not belong to this organization"
            });
        }

        // Check if current user is a member of this channel
        const isChannelMember = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: channelId,
                    userId: currentUserId
                }
            }
        });

        if (!isChannelMember && !['OWNER', 'ADMIN'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "You must be a channel member or admin to view member list"
            });
        }

        // Get all channel members with user details
        const channelMembers = await prisma.channelMember.findMany({
            where: {
                channelId: channelId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                user: {
                    username: 'asc'
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Channel members retrieved successfully",
            data: {
                channelId: channelId,
                channelName: channel.name,
                memberCount: channelMembers.length,
                members: channelMembers.map(member => ({
                    userId: member.user.id,
                    username: member.user.username,
                    email: member.user.email
                }))
            }
        });

    } catch (error) {
        console.error("Error getting channel members:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
