import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateParams } from '@/middleware/validation';
import { upload } from '@/middleware/multer';
import { 
    attachmentSchema, 
    updateAttachmentSchema, 
    attachmentParamsSchema,
    taskAttachmentParamsSchema,
    projectAttachmentParamsSchema
} from '@/schemas';
import { 
    createAttachment,
    getTaskAttachments,
    getProjectAttachments,
    getAttachment,
    deleteAttachment,
    updateAttachment
} from '@/controllers/attachmentController';

const attachmentRouter = express.Router();

// Upload file attachment
attachmentRouter.post("/", authenticateToken, upload.single('file'), validateRequest(attachmentSchema), createAttachment);

// Get task attachments
attachmentRouter.get("/task/:id", validateParams(taskAttachmentParamsSchema), authenticateToken, getTaskAttachments);

// Get project attachments
attachmentRouter.get("/project/:id", validateParams(projectAttachmentParamsSchema), authenticateToken, getProjectAttachments);

// Get single attachment by ID
attachmentRouter.get("/:id", validateParams(attachmentParamsSchema), authenticateToken, getAttachment);

// Update attachment (filename or file)
attachmentRouter.put("/:id", authenticateToken, upload.single('file'), validateParams(attachmentParamsSchema), validateRequest(updateAttachmentSchema), updateAttachment);

// Delete attachment
attachmentRouter.delete("/:id", validateParams(attachmentParamsSchema), authenticateToken, deleteAttachment);

export default attachmentRouter;
