import { 
    createLabel, 
    getLabels, 
    updateLabel, 
    deleteLabel 
} from '@/controllers/labelController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateParams } from '@/middleware/validation';
import { labelSchema, updateLabelSchema, idParamSchema } from '@/schemas';
import express from 'express';

const labelRouter = express.Router();

// Create label
labelRouter.post("/", validateRequest(labelSchema), authenticateToken, createLabel);

// Get all organization labels
labelRouter.get("/", authenticateToken, getLabels);

// Update label
labelRouter.put("/:id", validateParams(idParamSchema), validateRequest(updateLabelSchema), authenticateToken, updateLabel);

// Delete label
labelRouter.delete("/:id", validateParams(idParamSchema), authenticateToken, deleteLabel);

export default labelRouter;
