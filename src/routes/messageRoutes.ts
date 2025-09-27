import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateParams, validateQuery } from '@/middleware/validation';
import {
    sendMessageSchema,
    updateMessageSchema,
    messageParamsSchema,
    channelMessagesParamsSchema,
    getMessagesQuerySchema
} from '@/schemas';
import {
    sendMessage,
    getMessages,
    updateMessage,
    deleteMessage
} from '@/controllers/messageController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/channels/:id/messages - Send message to channel
router.post(
    '/:id/messages',
    validateParams(channelMessagesParamsSchema),
    validateRequest(sendMessageSchema),
    sendMessage
);

// GET /api/channels/:id/messages - Get messages from channel (paginated)
router.get(
    '/:id/messages',
    validateParams(channelMessagesParamsSchema),
    validateQuery(getMessagesQuerySchema),
    getMessages
);

// PATCH /api/messages/:id - Edit message (only sender)
router.patch(
    '/messages/:id',
    validateParams(messageParamsSchema),
    validateRequest(updateMessageSchema),
    updateMessage
);

// DELETE /api/messages/:id - Delete message (sender or admin)
router.delete(
    '/messages/:id',
    validateParams(messageParamsSchema),
    deleteMessage
);

export default router;


