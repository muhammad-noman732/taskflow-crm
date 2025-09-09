import { Request, Response } from "express";
import { prisma } from "@/config/db";


export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, company, type = "CRM", notes } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or no organization context",
      });
    }

    // ✅ Only OWNER/ADMIN/MANAGER can create clients
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user?.userId!,
          organizationId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to create clients",
      });
    }

    // 🚨 If someone tries to create an INVITED client manually, block it
    if (type === "INVITED") {
      return res.status(400).json({
        success: false,
        message:
          "INVITED clients are created automatically when an invitation is accepted.",
      });
    }

    // Check if client with email already exists in this organization
    if (email) {
      console.log("Checking for duplicate email:", email, "in organization:", organizationId);
      
      const existingClient = await prisma.client.findFirst({
        where: {
          email,
          organizationId: organizationId
        }
      });

      console.log("Found existing client:", existingClient);

      if (existingClient) {
        console.log("Duplicate found, returning error");
        return res.status(409).json({
          success: false,
          message: "Client with this email already exists in this organization"
        });
      }
    } else {
      console.log("No email provided, skipping duplicate check");
    }

    // ✅ Create CRM client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        company,
        type: "CRM",
        notes,
        organizationId,
      },
      include: {
        Organization: true,
        user: {
          select: { id: true, username: true, email: true },
        },
        projects: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: `CRM client created successfully`,
      data: client,
    });
  } catch (error) {
    console.error("Create client error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Auto-create client when invitation with role=CLIENT is accepted
 * - Called after User is created
 */
export const createInvitedClient = async (
  userId: string,
  organizationId: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found for invited client");

  // Check if client already exists for this user/org
  const existing = await prisma.client.findFirst({
    where: { userId, organizationId },
  });
  if (existing) return existing;

  // Create client linked to this user
  return await prisma.client.create({
    data: {
      name: user.username,
      email: user.email,
      type: "INVITED",
      userId,
      organizationId,
    },
  });
};



//  getAllClients()    // Get all clients in organization
export const getAllClients = async (req: Request, res: Response) => {
    try {
        const currentOrgId = req.user?.organizationId;
        if (!currentOrgId ) {
          return res.status(401).json({
             success: false,
             message: "User not authenticated or no organization context",
        });
      }


    // Check if user has permission to create clients (OWNER, ADMIN, MANAGER)
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
             userId: req.user?.userId!,
             organizationId: currentOrgId ,
                },
            },
        });

          if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to get clients",
      });
    }

    const allClients = await prisma.client.findMany({
        where :{
            organizationId: currentOrgId 
        },
        include:{
          Organization:true,
          user:{
            select:{
              username:true,
              email:true,
              id:true
            }
          },
          projects:true
        }
    })
    return res.status(200).json({
      success: true,
      message: "Clients retrieved successfully",
      data: allClients
    });
  } catch (error) {
    console.error("Get all clients error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// - getClientById()    // Get specific client
export const getClientById = async (req: Request, res: Response) => {
    try {
        const currentOrgId = req.user?.organizationId;
        const clientId = req.params.id;

        if (!currentOrgId ) {
          return res.status(401).json({
             success: false,
             message: "User not authenticated or no organization context",
        });
      }

    // Check if user has permission to create clients (OWNER, ADMIN, MANAGER)
        const membership = await prisma.organizationMembership.findUnique({
          where: {
           userId_organizationId: {
             userId: req.user?.userId!,
             organizationId: currentOrgId ,
          },
       },
     });

    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to get client by id ",
      });
    }
    const client = await prisma.client.findFirst({
        where :{
            organizationId: currentOrgId ,
            id: clientId
        },
         include:{
          Organization:true,
          user:{
            select:{
              username:true,
              email:true,
              id:true
            }
          },
          projects:true
        }
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

       return res.status(200).json({
      success: true,
      message: "Client retrieved successfully",
      data: client
    });
     } catch (error) {
    console.error("Get client by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// - updateClient()     // Update client details

export const updateClient = async (req: Request, res: Response) => {
    try {
        const currentOrgId = req.user?.organizationId;
        const clientId = req.params.id;
        const {name , company , email, type, userId, notes} = req.body;
        if (!currentOrgId ) {
          return res.status(401).json({
             success: false,
             message: "User not authenticated or no organization context",
        });
      }

    // Check if user has permission to create clients (OWNER, ADMIN, MANAGER)
        const membership = await prisma.organizationMembership.findUnique({
          where: {
           userId_organizationId: {
             userId: req.user?.userId!,
             organizationId: currentOrgId ,
          },
       },
     });

    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update clients",
      });
    }

    // Check if client exists in this organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: currentOrgId,
      },
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
   

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (type) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;

    const clientInfo = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
       include:{
          Organization:true,
          user:{
            select:{
              username:true,
              email:true,
              id:true
            }
          },
          projects:true
        }
    });

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: clientInfo
    });
  } catch (error) {
    console.error("Update client error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}


// - deleteClient()     // Remove client
export const deleteClient = async (req: Request, res: Response) => {
    try {
        const currentOrgId = req.user?.organizationId;
        const clientId = req.params.id;
   
        if (!currentOrgId ) {
          return res.status(401).json({
             success: false,
             message: "User not authenticated or no organization context",
        });
      }

    // Check if user has permission to create clients (OWNER, ADMIN, MANAGER)
        const membership = await prisma.organizationMembership.findUnique({
          where: {
           userId_organizationId: {
             userId: req.user?.userId!,
             organizationId: currentOrgId ,
          },
       },
     });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to delete clients",
      });
    }

    // Check if client exists in this organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: currentOrgId,
      },
      include:{
          Organization:true,
          user:{
            select:{
              username:true,
              email:true,
              id:true
            }
          },
          projects:true
        }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Check if client has projects
    if (existingClient.projects.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete client with existing projects. Please delete or reassign projects first.",
      });
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Delete client error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

