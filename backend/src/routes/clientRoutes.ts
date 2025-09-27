import { Router } from "express";
import { authenticateToken, authorizeRole } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import { clientSchema } from "@/schemas";
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from "@/controllers/clientController";

const clientRouter = Router();
// All routes require authentication
clientRouter.use(authenticateToken);

// Create client (OWNER, ADMIN, MANAGER only)
clientRouter.post(
  "/create",
  validateRequest(clientSchema),
  authorizeRole('OWNER', 'ADMIN', 'MANAGER'),
  createClient
);


// Get all clients in organization
clientRouter.get("/",  getAllClients);

// Get client by ID
clientRouter.get("/:id", getClientById);

// Update client (OWNER, ADMIN, MANAGER only)
clientRouter.put(
  "/:id",
  validateRequest(clientSchema),
  authorizeRole('OWNER', 'ADMIN', 'MANAGER'),
  updateClient
);

// Delete client (OWNER, ADMIN only)
clientRouter.delete(
  "/:id",
  authorizeRole('OWNER', 'ADMIN'),
  deleteClient
);

export default clientRouter;
