
import { prisma } from "@/config/db";
import { Request, Response } from "express";

// Get all payments for the organization
export const getPayments = async (req: Request, res: Response) => {
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

        // 3. Check permissions (only OWNER, ADMIN, MANAGER can view payments)
        if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions to view payments",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Get query parameters for filtering
        const { 
            method,
            clientId,
            startDate,
            endDate,
            page = '1',
            limit = '10'
        } = req.query;

        // 5. Build whereClause for database filtering
        const whereClause: any = {
            invoice: {
                orgId: organizationId  // Always filter by user's organization
            }
        };

        // Add filters only if provided by user
        if (method) whereClause.method = method;
        if (clientId) whereClause.invoice.clientId = clientId;
        if (startDate || endDate) {
            whereClause.paidAt = {};
            if (startDate) whereClause.paidAt.gte = new Date(startDate as string);
            if (endDate) whereClause.paidAt.lte = new Date(endDate as string);
        }

        // 6. Get payments using whereClause (database filtering)
        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        total: true,
                        status: true,
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
                }
            },
            orderBy: { paidAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            message: "Payments retrieved successfully",
            data: {
                payments: payments
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Get payments error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Get single payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
    try {
        const paymentId = req.params.id;
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
                message: "Insufficient permissions to view payment details",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Find payment with all related data
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                invoice: {
                    orgId: organizationId
                }
            },
            include: {
                invoice: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                company: true,
                                email: true,
                              
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
                        lines: {
                            select: {
                                description: true,
                                qty: true,
                                unitPrice: true,
                                amount: true
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment retrieved successfully",
            data: payment,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Get payment by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Create payment (simple - just record payment details)
export const createPayment = async (req: Request, res: Response) => {
    try {
        const { invoiceId, amount, method, reference, notes } = req.body;
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
        
        // 3. Check permissions (only OWNER, ADMIN, MANAGER can create payments)
                if (!['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
                            return res.status(403).json({
                                success: false,
                message: "Insufficient permissions to create payments",
                timestamp: new Date().toISOString()
            });
        }

        // 4. Validate invoice exists and belongs to organization
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                orgId: organizationId
            },
            select: {
                id: true,
                invoiceNo: true,
                total: true,
                status: true,
                client: {
            select: {
                        name: true,
                        company: true
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

        // 5. Create payment record
        const newPayment = await prisma.payment.create({
            data: {
                invoiceId: invoiceId,
                amount: parseFloat(amount.toString()),
                method: method,
                paidAt: new Date(),
                reference: reference || null,
                notes: notes || null
            },
            include: {
                invoice: {
                    select: {
                        invoiceNo: true,
                        total: true,
                        client: {
                            select: {
                                name: true,
                                company: true
                            }
                        }
                    }
                }
            }
        });

        // 6. Update invoice status to PAID (simple approach)
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' }
        });

        return res.status(201).json({
            success: true,
            message: "Payment created successfully",
            data: newPayment,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Create payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};

// Update payment details
export const updatePayment = async (req: Request, res: Response) => {
    try {
        const paymentId = req.params.id;
        const { method, reference, notes } = req.body;
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

        // 3. Check permissions (only OWNER, ADMIN can update payments)
        if (!['OWNER', 'ADMIN'].includes(membership.role)) {
            return res.status(403).json({
                success: false,
                message: "Only organization owners and admins can update payments",
                                timestamp: new Date().toISOString()
                            });
                        }

        // 4. Find and validate payment
        const existingPayment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                invoice: {
                orgId: organizationId
            }
        }
        });

        if (!existingPayment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found or doesn't belong to this organization",
                timestamp: new Date().toISOString()
            });
        }

        // 5. Update payment
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                method: method || existingPayment.method,
                reference: reference !== undefined ? reference : existingPayment.reference,
                notes: notes !== undefined ? notes : existingPayment.notes
            },
            include: {
                invoice: {
                    select: {
                        invoiceNo: true,
                        client: {
                            select: {
                                name: true,
                                company: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            data: updatedPayment,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Update payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
            timestamp: new Date().toISOString()
        });
    }
};