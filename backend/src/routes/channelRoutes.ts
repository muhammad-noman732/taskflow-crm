import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateQuery, validateParams } from '@/middleware/validation';
import {
    createChannelSchema,
    updateChannelSchema,
    channelParamsSchema,
    channelQuerySchema
} from '@/schemas';
import {
    createChannel,
    getChannels,
    getChannelById,
    updateChannel,
    deleteChannel
} from '@/controllers/channelController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/channels - Create a new channel
router.post(
    '/',
    validateRequest(createChannelSchema),
    createChannel
);

// GET /api/channels - List all channels for the logged-in user
router.get(
    '/',
    validateQuery(channelQuerySchema),
    getChannels
);

// GET /api/channels/:id - Get a single channel details
router.get(
    '/:id',
    validateParams(channelParamsSchema),
    getChannelById
);

// PATCH /api/channels/:id - Update channel info
router.patch(
    '/:id',
    validateParams(channelParamsSchema),
    validateRequest(updateChannelSchema),
    updateChannel
);

// DELETE /api/channels/:id - Delete channel
router.delete(
    '/:id',
    validateParams(channelParamsSchema),
    deleteChannel
);

export default router;
