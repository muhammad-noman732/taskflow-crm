import express from 'express';
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    markAsPaid,
    deleteInvoice
} from '@/controllers/invoiceController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    invoiceParamsSchema,
    invoiceQuerySchema,
    markAsPaidSchema
} from '@/schemas';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Invoice CRUD operations
router.post('/', 
    validateRequest(createInvoiceSchema), 
    createInvoice
);

router.get('/', 
    validateRequest(invoiceQuerySchema), 
    getInvoices
);

router.get('/:id', 
    validateRequest(invoiceParamsSchema), 
    getInvoiceById
);

router.put('/:id', 
    validateRequest(invoiceParamsSchema, ),
    validateRequest(updateInvoiceSchema), 
    updateInvoice
);

router.patch('/:id/mark-paid', 
    validateRequest(invoiceParamsSchema),
    validateRequest(markAsPaidSchema), 
    markAsPaid
);

router.delete('/:id', 
    validateRequest(invoiceParamsSchema), 
    deleteInvoice
);

export default router;
