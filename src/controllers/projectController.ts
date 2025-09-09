import { Request, Response } from "express";
import { prisma } from "@/config/db";

// POST /projects (create project inside org)
// this project will belong to the client of the same oranization so he can view the project status

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, description, deadline, clientId } = req.body;
        console.log("client id " , clientId);
        console.log("User from JWT:", req.user);
        console.log("Organization ID:", req.user?.organizationId);

        // Current logged in user id
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // If clientId is provided, validate it belongs to same organization
        if (clientId) {
            const client = await prisma.client.findFirst({
                where: {
                    id: clientId,
                    organizationId: currentOrgId // Same organization as membership
                }
            });

            if (!client) {
                return res.status(400).json({
                    success: false,
                    message: "Client not found or doesn't belong to this organization"
                });
            }
        }
        
        // Find the organization membership of user (before creating the project should be member of the org)
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });


        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization",
            });
        }


        // Create project linked to membership
        const project = await prisma.project.create({
            data: {
                name,
                description,
                deadline,
                membershipId: membership.id, // Link to membership
                clientId: clientId, 
            },
            include: {
                membership: {
                    include: {
                        organization: true,
                        user: {
                                select: {
                                    username: true,
                                    email: true,
                                    isVerified: true
                                }
                            }

                        }
                    }
                }
    })

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project,
        });

    } catch (error) {
        console.error("Create project error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// GET /projects (list all projects of org)

export const getAllProject = async (req: Request, res: Response) => {
    try {
        console.log("route start of getall projects ");
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId;

        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context",
            });
        }

        // Find the organization membership of user
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization",
            });
        }


        // get all the projects with organization( all of the user organization where he is) and createdBy details
        const allProjects = await prisma.project.findMany({
            where: {
                membershipId: membership.id
            },
            include: {
                membership: true,
            },
        });

        console.log("get all project", getAllProject);

        if (!allProjects) {
            return res.status(501).json({
                message: "No project found",
                data: null,
            });
        }

        return res.status(200).json({
            message: "projects fetched successfully",
            data: allProjects,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "something went wrong",
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// GET /projects/:id (fetch single project with tasks)

export const getProjectById = async (req: Request, res: Response) => {
    try {
        //   check user is logged in
        const projectId = req.params.id;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId


        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context"
            });
        }


        // Find the organization membership of user
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization"
            });
        }

        // get all the project with the organization and user detail
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                membershipId: membership.id,
            },
            include: {
                membership: true
            },
        });

        console.log("project", project);
        if (!project) {
            return res.status(501).json({
                message: "No project found with this id ",
                data: null,
            });
        }

        return res.status(200).json({
            message: "project of the required id get successfully",
            data: project,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "something went wrong",
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// PATCH /projects/:id (update)

export const updateProjectById = async (req: Request, res: Response) => {
    try {

        const projectId = req.params.id;
        const { name, description, deadline } = req.body;
        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId


        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context"
            });
        }


        // Find the organization membership of user
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization"
            });
        }


        // Build the update object dynamically
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (deadline) updateData.deadline = new Date(deadline);

        const updatedProject = await prisma.project.update({
            where: {
                id: projectId,
                membershipId: membership.id
            },
            data: updateData, // <-- pass the fields directly
            include: {
                membership: true,
            },
        });

        return res.status(200).json({
            message: "Project updated successfully",
            data: updatedProject,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "something went wrong",
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

// DELETE /projects/:id

export const deleteProjectById = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.id;

        const currentUserId = req.user?.userId;
        const currentOrgId = req.user?.organizationId


        if (!currentUserId || !currentOrgId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated or no organization context"
            });
        }


        // Find the organization membership of user
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                // user composite key here for uniqueness
                userId_organizationId: {
                    userId: currentUserId,
                    organizationId: currentOrgId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this organization"
            });
        }

        // get all the project with the organization and user detail
        const deletedProject = await prisma.project.delete({
            where: {
                id: projectId,
                membershipId: membership.id
            },
            include: {
                membership: true,
            }
        });

        return res.status(200).json({
            message: "projects deleted  successfully",
            data: deletedProject,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "something went wrong",
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
