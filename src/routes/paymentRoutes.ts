import express from 'express';
import {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment
} from '@/controllers/paymentController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import {
    createPaymentSchema,
    updatePaymentSchema,
    paymentParamsSchema,
    paymentQuerySchema
} from '@/schemas';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Payment operations
router.post('/', 
    validateRequest(createPaymentSchema), 
    createPayment
);

router.get('/', 
    validateRequest(paymentQuerySchema), 
    getPayments
);

router.get('/:id', 
    validateRequest(paymentParamsSchema), 
    getPaymentById
);

router.put('/:id', 
    validateRequest(paymentParamsSchema),
    validateRequest(updatePaymentSchema), 
    updatePayment
);

export default router;
