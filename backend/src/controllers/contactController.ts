import { prisma } from "@/config/db";
import { Request, Response } from "express";

// createContact - Add new contact to a client
export const createContact = async (req: Request, res: Response) => {
    try {
        const { clientId, name, email, phone, position, isPrimary = false } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        
        // 1. Authentication check
                if (!userId || !organizationId) {
                    return res.status(401).json({
                        success: false,
                message: "User not authenticated or no organization context",
                timestamp: new Date().toISOString()
            });
        }

        // 2. Input validation
        if (!name || !clientId) {
            return res.status(400).json({
                success: false,
                message: "Name and clientId are required",
                        timestamp: new Date().toISOString()
                    });
                }
        
        // 3. Validate membership
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
                message: "Not a member of this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Check permissions (only OWNER, ADMIN, MANAGER can create contacts)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
                    return res.status(403).json({
                        success: false,
                message: "Insufficient permissions to create contacts",
                        timestamp: new Date().toISOString()
                    });
                }
        
        // 5. Verify client exists and belongs to organization
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organizationId: organizationId
            }
        });
            
        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 6. If setting as primary, unset other primary contacts for this client
        if (isPrimary) {
            await prisma.contact.updateMany({
                where: {
                    clientId: clientId,
                    isPrimary: true
                },
                data: {
                    isPrimary: false
                }
            });
        }

        // 7. Create contact
        const newContact = await prisma.contact.create({
            data: {
                clientId,
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                position: position?.trim() || null,
                isPrimary
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Contact created successfully",
            data: newContact,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Create contact error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
};
// getClientContacts - List all contacts for a client
export const getClientContacts = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        // 1. Authentication check
        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
                timestamp: new Date().toISOString()
            });
        }

        // 2. Validate membership
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
                message: "Not a member of this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 3. Verify client exists and belongs to organization
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                organizationId: organizationId
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Get all contacts for the client
        const contacts = await prisma.contact.findMany({
            where: {
                clientId: clientId
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            },
            orderBy: [
                { isPrimary: 'desc' }, // Primary contacts first
                { name: 'asc' }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Client contacts retrieved successfully",
            data: contacts,
            count: contacts.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get client contacts error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
};

// getContactById - Get single contact by ID
export const getContactById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        // 1. Authentication check
        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
                timestamp: new Date().toISOString()
            });
        }

        // 2. Validate membership
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
                message: "Not a member of this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 3. Get contact with organization validation
        const contact = await prisma.contact.findFirst({
            where: {
                id: id,
                client: {
                    organizationId: organizationId
                }
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            }
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact retrieved successfully",
            data: contact,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Get contact by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
};

// updateContact - Modify contact details
export const updateContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, position, isPrimary } = req.body;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;
        
        // 1. Authentication check
                if (!userId || !organizationId) {
                    return res.status(401).json({
                        success: false,
                message: "User not authenticated or no organization context",
                        timestamp: new Date().toISOString()
                    });
                }
        
        // 2. Validate membership
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
                message: "Not a member of this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 3. Check permissions (only OWNER, ADMIN, MANAGER can update contacts)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
                    return res.status(403).json({
                        success: false,
                message: "Insufficient permissions to update contacts",
                        timestamp: new Date().toISOString()
                    });
                }
        
        // 4. Find contact and verify it belongs to organization
        const existingContact = await prisma.contact.findFirst({
            where: {
                id: id,
                client: {
                    organizationId: organizationId
                }
            },
            include: {
                client: true
            }
        });

        if (!existingContact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 5. If setting as primary, unset other primary contacts for this client
        if (isPrimary === true) {
            await prisma.contact.updateMany({
                where: {
                    clientId: existingContact.clientId,
                    isPrimary: true,
                    id: { not: id } // Exclude current contact
                },
                data: {
                    isPrimary: false
                }
            });
        }

        // 6. Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email?.trim() || null;
        if (phone !== undefined) updateData.phone = phone?.trim() || null;
        if (position !== undefined) updateData.position = position?.trim() || null;
        if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

        // 7. Update contact
        const updatedContact = await prisma.contact.update({
            where: {
                id: id
            },
            data: updateData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Contact updated successfully",
            data: updatedContact,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Update contact error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
};

// deleteContact - Remove contact
export const deleteContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const organizationId = req.user?.organizationId;

        // 1. Authentication check
        if (!userId || !organizationId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
                timestamp: new Date().toISOString()
            });
        }

        // 2. Validate membership
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
                message: "Not a member of this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 3. Check permissions (only OWNER, ADMIN, MANAGER can delete contacts)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to delete contacts",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Find contact and verify it belongs to organization
        const existingContact = await prisma.contact.findFirst({
            where: {
                id: id,
                client: {
                    organizationId: organizationId
                }
            }
        });

        if (!existingContact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Delete contact
        await prisma.contact.delete({
            where: {
                id: id
            }
        });

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Delete contact error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
};