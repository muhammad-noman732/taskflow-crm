import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest, validateParams } from '@/middleware/validation';
import {
    addChannelMembersSchema,
    channelMemberParamsSchema,
    removeChannelMemberParamsSchema
} from '@/schemas';
import {
    addChannelMembers,
    removeChannelMember,
    getChannelMembers
} from '@/controllers/channelMemberController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/channels/:id/members - Add member(s) to channel
router.post(
    '/:id/members',
    validateParams(channelMemberParamsSchema),
    validateRequest(addChannelMembersSchema),
    addChannelMembers
);

// DELETE /api/channels/:id/members/:userId - Remove member from channel
router.delete(
    '/:id/members/:userId',
    validateParams(removeChannelMemberParamsSchema),
    removeChannelMember
);

// GET /api/channels/:id/members - List channel members
router.get(
    '/:id/members',
    validateParams(channelMemberParamsSchema),
    getChannelMembers
);

export default router;
