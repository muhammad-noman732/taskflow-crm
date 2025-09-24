import express from 'express';
import { 
  startTimer,
  stopTimer,
  createTimeEntry,
  getTimeEntries,
  getTimeEntryById,
  updateTimeEntry,
  deleteTimeEntry,
  getActiveTimer
} from '@/controllers/timeEntryController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { 
  startTimerSchema,
  stopTimerSchema,
  createTimeEntrySchema,
  updateTimeEntrySchema,
  timeEntryParamsSchema,
  timeEntryQuerySchema
} from '@/schemas';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Timer routes
router.post('/start-timer', validateRequest(startTimerSchema), startTimer);                    // POST /api/time-entries/start-timer
router.post('/stop-timer', validateRequest(stopTimerSchema), stopTimer);                      // POST /api/time-entries/stop-timer
router.get('/active-timer', getActiveTimer);                                                  // GET /api/time-entries/active-timer

// Time entry CRUD routes
router.post('/', validateRequest(createTimeEntrySchema), createTimeEntry);                    // POST /api/time-entries
router.get('/', validateRequest(timeEntryQuerySchema), getTimeEntries);             // GET /api/time-entries
router.get('/:id', validateRequest(timeEntryParamsSchema), getTimeEntryById);      // GET /api/time-entries/:id
router.put('/:id', validateRequest(timeEntryParamsSchema), validateRequest(updateTimeEntrySchema), updateTimeEntry);  // PUT /api/time-entries/:id
router.delete('/:id', validateRequest(timeEntryParamsSchema), deleteTimeEntry);    // DELETE /api/time-entries/:id

export default router;

