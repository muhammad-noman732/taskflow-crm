import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateParams } from '@/middleware/validation';
import { 
    taskLabelSchema, 
    bulkTaskLabelSchema, 
    taskLabelParamsSchema, 
    taskParamsSchema 
} from '@/schemas';
import { 
    addLabelToTask, 
    removeLabelFromTask, 
    getTaskLabels, 
    bulkAssignLabels 
} from '@/controllers/taskLabelController';

const taskLabelRouter = express.Router();

// Add single label to task
taskLabelRouter.post("/", validateRequest(taskLabelSchema), authenticateToken, addLabelToTask);

// Bulk assign multiple labels to task
taskLabelRouter.post("/bulk", validateRequest(bulkTaskLabelSchema), authenticateToken, bulkAssignLabels);

// Get all labels for a specific task
taskLabelRouter.get("/task/:taskId", validateParams(taskParamsSchema), authenticateToken, getTaskLabels);

// Remove specific label from task
taskLabelRouter.delete("/:taskId/:labelId", validateParams(taskLabelParamsSchema), authenticateToken, removeLabelFromTask);

export default taskLabelRouter;
