import { prisma } from "@/config/db";
import { Request, Response } from "express";

// Generate invoice from time entries or project pricing
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { 
            clientId, 
            projectId, 
            dueDate, 
            notes,
            timeEntryIds = [] // Array of time entry IDs to include in invoice
        } = req.body;
        
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
        
        // 3. Check permissions (only OWNER, ADMIN, MANAGER can create invoices)
                if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
                            return res.status(403).json({
                                success: false,
                message: "Insufficient permissions to create invoices",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Input validation
        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: "Client ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Get organization details for defaults
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                defaultHourlyRate: true,
                currency: true,
                taxRate: true
            }
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
                                timestamp: new Date().toISOString()
                            });
                        }
                
        // 6. Validate client exists and belongs to organization
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

        // 7. Validate project if provided
        let project = null;
        if (projectId) {
            project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    orgId: organizationId
                },
                include: {
                    client: true
                }
            });

            if (!project) {
            return res.status(404).json({
                    success: false,
                    message: "Project not found or doesn't belong to this organization",
                    timestamp: new Date().toISOString()
                });
            }

            // Ensure project belongs to the same client
            if (project.clientId !== clientId) {
                return res.status(400).json({
                    success: false,
                    message: "Project doesn't belong to the specified client",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // 8. Generate unique invoice number
        const lastInvoice = await prisma.invoice.findFirst({
            where: { orgId: organizationId },
            orderBy: { createdAt: 'desc' },
            select: { invoiceNo: true }
        });

        let invoiceNumber = 'INV-001';
        if (lastInvoice && lastInvoice.invoiceNo) {
            const lastNumber = parseInt(lastInvoice.invoiceNo.split('-')[1]) || 0;
            invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`;
        }

        // 9. Calculate invoice amounts based on project type(critical part)
        let subtotal = 0;
        let invoiceLines: any[] = [];
        let invoiceTimeEntries: any[] = [];

        if (project) {
            if (project.pricingType === 'FIXED') {
                // Fixed price project
                subtotal = project.fixedPrice ? parseFloat(project.fixedPrice.toString()) : 0;
                invoiceLines.push({
                    description: `${project.name} - Fixed Price`,
                    qty: 1,
                    unitPrice: subtotal,
                    amount: subtotal
                });
            } else {
                // Hourly project - calculate from time entries
                if (timeEntryIds.length > 0) {
                    const timeEntries = await prisma.timeEntry.findMany({
                        where: {
                            id: { in: timeEntryIds },
                            billable: true,
                            task: {
                                project: { orgId: organizationId }
                            }
                        },
                        include: {
                            user: true,
                            task: true
                        }
                    });

                    for (const entry of timeEntries) {
                        const hours = (entry.minutes || 0) / 60;
                        const rate = project.hourlyRate || 
                                   client.customHourlyRate || 
                                   organization.defaultHourlyRate || 50;
                        const amount = hours * parseFloat(rate.toString());
                        
                        subtotal += amount;
                        
                        invoiceLines.push({
                            description: `${entry.user.username} - ${entry.task.title}`,
                            qty: hours,
                            unitPrice: parseFloat(rate.toString()),
                            amount: amount
                        });

                        invoiceTimeEntries.push({
                            timeEntryId: entry.id,
                            hourlyRate: parseFloat(rate.toString()),
                            hours: hours,
                            amount: amount
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Time entry IDs are required for hourly projects",
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Project ID is required for invoice generation",
                timestamp: new Date().toISOString()
            });
        }

        // 10. Calculate tax and total
        const taxRate = organization.taxRate || 0;
        const tax = subtotal * (parseFloat(taxRate.toString()) / 100);
        const total = subtotal + tax;

        // 11. Create invoice
        const newInvoice = await prisma.invoice.create({
            data: {
                orgId: organizationId,
                clientId: clientId,
                projectId: projectId,
                invoiceNo: invoiceNumber,
                issueDate: new Date(),
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                status: 'DRAFT',
                currency: organization.currency || 'USD',
                subtotal: subtotal,
                tax: tax,
                total: total,
                notes: notes?.trim() || null,
                lines: {
                    create: invoiceLines
                },
                timeEntries: {
                    create: invoiceTimeEntries
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                        pricingType: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                          status: true
                    }
                },
                lines: true,
                timeEntries: {
                    include: {
                        timeEntry: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        email: true
                                    }
                                },
                                task: {
                                    select: {
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: {
                ...newInvoice,
                summary: {
                    subtotal: subtotal,
                    tax: tax,
                    total: total,
                    currency: organization.currency || 'USD',
                    lineItems: invoiceLines.length,
                    timeEntries: invoiceTimeEntries.length
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Create invoice error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};


// updateInvoice - Modify invoice details

export const updateInvoice = async(req:Request , res:Response)=>{
    try {
         const { 
            clientId, 
            projectId, 
            dueDate, 
            notes,
            timeEntryIds = [] // Array of time entry IDs to include in invoice
        } = req.body;
         
        const invoiceId = req.params.id
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

        // 3. Check permissions (only OWNER, ADMIN, MANAGER can create invoices)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to update invoices",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Input validation
        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: "Client ID is required",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Get organization details for defaults
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                defaultHourlyRate: true,
                currency: true,
                taxRate: true
            }
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
                timestamp: new Date().toISOString()
            });
        }

        // 6. Validate client exists and belongs to organization
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


        // 7. Validate project if provided
        let project = null;
        if (projectId) {
            project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    orgId: organizationId
                },
                include: {
                    client: true
                }
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found or doesn't belong to this organization",
                    timestamp: new Date().toISOString()
                });
            }

            // Ensure project belongs to the same client
            if (project.clientId !== clientId) {
                return res.status(400).json({
                    success: false,
                    message: "Project doesn't belong to the specified client",
                    timestamp: new Date().toISOString()
                });
            }
        }

        // 8. Find and validate invoice
        const findInvoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: organizationId
            },
            include: {
                lines: true,
                timeEntries: true
            }
        });

        if (!findInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 9. Check if invoice can be updated (only DRAFT invoices)
        if (findInvoice.status !== "DRAFT") {
            return res.status(400).json({
                success: false,
                message: "Cannot update invoices that are SENT or PAID. Only DRAFT invoices can be modified.",
                timestamp: new Date().toISOString()
            });
        }

        // 10. Delete existing invoice lines and time entries
        await prisma.invoiceLine.deleteMany({
            where: { invoiceId: invoiceId }
        });

        await prisma.invoiceTimeEntry.deleteMany({
            where: { invoiceId: invoiceId }
        });

        // 11. Recalculate invoice amounts (same logic as createInvoice)
        let subtotal = 0;
        let invoiceLines: any[] = [];
        let invoiceTimeEntries: any[] = [];

        if (project) {
            if (project.pricingType === 'FIXED') {
                // Fixed price project
                subtotal = project.fixedPrice ? parseFloat(project.fixedPrice.toString()) : 0;
                invoiceLines.push({
                    description: `${project.name} - Fixed Price`,
                    qty: 1,
                    unitPrice: subtotal,
                    amount: subtotal
                });
            } else {
                // Hourly project - calculate from time entries
                if (timeEntryIds.length > 0) {
                    const timeEntries = await prisma.timeEntry.findMany({
                        where: {
                            id: { in: timeEntryIds },
                            billable: true,
                            task: {
                                project: { orgId: organizationId }
                            }
                        },
                        include: {
                            user: true,
                            task: true
                        }
                    });

                    for (const entry of timeEntries) {
                        const hours = (entry.minutes || 0) / 60;
                        const rate = project.hourlyRate || 
                                   client.customHourlyRate || 
                                   organization.defaultHourlyRate || 50;
                        const amount = hours * parseFloat(rate.toString());
                        
                        subtotal += amount;
                        
                        invoiceLines.push({
                            description: `${entry.user.username} - ${entry.task.title}`,
                            qty: hours,
                            unitPrice: parseFloat(rate.toString()),
                            amount: amount
                        });

                        invoiceTimeEntries.push({
                            timeEntryId: entry.id,
                            hourlyRate: parseFloat(rate.toString()),
                            hours: hours,
                            amount: amount
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Time entry IDs are required for hourly projects",
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Project ID is required for invoice generation",
                timestamp: new Date().toISOString()
            });
        }

        // 12. Calculate tax and total
        const taxRate = organization.taxRate || 0;
        const tax = subtotal * (parseFloat(taxRate.toString()) / 100);
        const total = subtotal + tax;

        // 13. Update invoice with new data
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                clientId: clientId,
                projectId: projectId,
                dueDate: dueDate ? new Date(dueDate) : findInvoice.dueDate,
                subtotal: subtotal,
                tax: tax,
                total: total,
                notes: notes?.trim() || findInvoice.notes,
                lines: {
                    create: invoiceLines
                },
                timeEntries: {
                    create: invoiceTimeEntries
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                        pricingType: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                        status: true
                    }
                },
                lines: true,
                timeEntries: {
                    include: {
                        timeEntry: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        email: true
                                    }
                                },
                                task: {
                                    select: {
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            data: {
                ...updatedInvoice,
                summary: {
                    subtotal: subtotal,
                    tax: tax,
                    total: total,
                    currency: organization.currency || 'USD',
                    lineItems: invoiceLines.length,
                    timeEntries: invoiceTimeEntries.length
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Update invoice error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
}

// Get all invoices for the organization
export const getInvoices = async (req: Request, res: Response) => {
    try {
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

        // 3. Check permissions (only OWNER, ADMIN, MANAGER can view invoices)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to view invoices",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Get query parameters for filtering and pagination
        const { 
            clientId, 
            projectId, 
            status, 
            startDate, 
            endDate,
            page = '1',
            limit = '10'
        } = req.query;

        // 5. Build whereClause for database filtering
        const whereClause: any = {
            orgId: organizationId  // Always filter by user's organization
        };

        // Add filters only if provided by user
        if (clientId) whereClause.clientId = clientId;
        if (projectId) whereClause.projectId = projectId;
        if (status) whereClause.status = status;
        if (startDate || endDate) {
            whereClause.issueDate = {};
            if (startDate) whereClause.issueDate.gte = new Date(startDate as string);
            if (endDate) whereClause.issueDate.lte = new Date(endDate as string);
        }

        // 6. Calculate pagination
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        // 7. Get invoices and total count (parallel - faster!)
        const [invoices, totalCount] = await Promise.all([
            // Get paginated invoices
            prisma.invoice.findMany({
                where: whereClause,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            company: true,
                            email: true
                        }
                    },
                    project: {
                        select: {
                            id: true,
                            name: true,
                            status: true
                        }
                    },
                    lines: true,
                    timeEntries: true
                },
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limitNum
            }),
            
            // Count total invoices (for pagination info)
            prisma.invoice.count({
                where: whereClause
            })
        ]);

        // 8. Calculate summary from current page invoices
      // Method 1: Using map + reduce (easier to understand)
        const amounts = invoices.map(invoice => parseFloat(invoice.total.toString()));
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
        
        // Method 2: Using map for status breakdown (easier to understand)
        const statuses = invoices.map(invoice => invoice.status);
        const statusBreakdown: Record<string, number> = {};
        
        statuses.forEach(status => {
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        return res.status(200).json({
            success: true,
            message: "Invoices retrieved successfully",
            data: {
                invoices: invoices,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum,
                    hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrevPage: pageNum > 1
                },
                summary: {
                    totalInvoices: totalCount,  // Total in database
                    currentPageAmount: totalAmount,  // Amount on current page
                    statusBreakdown: statusBreakdown  // Status count on current page
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Get invoices error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Get single invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const invoiceId = req.params.id;
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

        // 3. Check permissions
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to view invoice details",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Find invoice with all related data
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: organizationId
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true,
                        status: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                        pricingType: true,
                        fixedPrice: true,
                        hourlyRate: true
                    }
                },
                lines: {
                    orderBy: { createdAt: 'asc' }
                },
                timeEntries: {
                    include: {
                        timeEntry: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        email: true
                                    }
                                },
                                task: {
                                    select: {
                                        id: true,
                                        title: true,
                                        description: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                org: {
                    select: {
                        id: true,
                        name: true,
                        currency: true,
                        taxRate: true
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully",
            data: invoice,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Get invoice by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Mark invoice as paid
export const markAsPaid = async (req: Request, res: Response) => {
    try {
        const invoiceId = req.params.id;
        const { paidAt, paymentMethod, paymentReference, notes } = req.body;
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

        // 3. Check permissions
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to mark invoices as paid",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Find and validate invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: organizationId
            }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Check if invoice can be marked as paid
        if (invoice.status === 'PAID') {
            return res.status(400).json({
                success: false,
                message: "Invoice is already marked as paid",
                timestamp: new Date().toISOString()
            });
        }

        if (invoice.status === 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: "Cannot mark DRAFT invoice as paid. Please send the invoice first.",
                timestamp: new Date().toISOString()
            });
        }

        if (invoice.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: "Cannot mark CANCELLED invoice as paid",
                timestamp: new Date().toISOString()
            });
        }

        // 6. Update invoice status to PAID
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: 'PAID'
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true
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
            message: "Invoice marked as paid successfully",
            data: {
                invoice: updatedInvoice,
                paymentDetails: {
                    paidAt: paidAt || new Date().toISOString(),
                    paymentMethod: paymentMethod || 'Not specified',
                    paymentReference: paymentReference || null,
                    notes: notes || null
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Mark as paid error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Delete invoice (only DRAFT invoices)
export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const invoiceId = req.params.id;
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

        // 3. Check permissions (only OWNER can delete invoices)
        if (!['OWNER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Only organization owners can delete invoices",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Find and validate invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: organizationId
            },
            include: {
                client: {
                    select: {
                        name: true,
                        company: true
                    }
                },
                project: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Check if invoice can be deleted (only DRAFT invoices)
        if (invoice.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: "Only DRAFT invoices can be deleted. Cannot delete SENT or PAID invoices.",
                timestamp: new Date().toISOString()
            });
        }

        // 6. Delete invoice and related data (in correct order due to foreign key constraints)
        // because if directly delete the invoice than lineInvoice and timeentry still exists
        await prisma.$transaction(async (tx) => {
            // Delete invoice time entries first
            await tx.invoiceTimeEntry.deleteMany({
                where: { invoiceId: invoiceId }
            });

            // Delete invoice lines
            await tx.invoiceLine.deleteMany({
                where: { invoiceId: invoiceId }
            });

            // Finally delete the invoice
            await tx.invoice.delete({
                where: { id: invoiceId }
            });
        });

        return res.status(200).json({
            success: true,
            message: "Invoice deleted successfully",
            data: {
                deletedInvoice: {
                    id: invoice.id,
                    invoiceNo: invoice.invoiceNo,
                    client: invoice.client?.name || invoice.client?.company,
                    project: invoice.project?.name,
                    total: invoice.total,
                    status: invoice.status
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Delete invoice error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};