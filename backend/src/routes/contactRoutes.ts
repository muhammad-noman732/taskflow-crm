import express from 'express';
import { 
  createContact, 
  getClientContacts, 
  getContactById, 
  updateContact, 
  deleteContact 
} from '@/controllers/contactController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { 
  createContactSchema, 
  updateContactSchema, 
  contactParamsSchema, 
  clientContactsParamsSchema 
} from '@/schemas';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Contact routes with validation
router.post('/', validateRequest(createContactSchema), createContact);                           // POST /api/contacts
router.get('/client/:clientId', validateRequest(clientContactsParamsSchema), getClientContacts);       // GET /api/contacts/client/:clientId
router.get('/:id', validateRequest(contactParamsSchema), getContactById);                       // GET /api/contacts/:id
router.put('/:id', validateRequest(contactParamsSchema), validateRequest(updateContactSchema), updateContact);                        // PUT /api/contacts/:id
router.delete('/:id', validateRequest(contactParamsSchema), deleteContact);                     // DELETE /api/contacts/:id

export default router;
