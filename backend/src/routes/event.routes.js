import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  registerForEvent,
  getEventParticipants
} from '../controllers/event.controller.js';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);

// Protected routes (require authentication)
router.use(authenticate);

// Event registration
router.post('/:id/register', registerForEvent);
router.get('/:id/participants', getEventParticipants);

// Organizer and admin routes
router.post('/', authorize(['admin', 'organizer']), createEvent);
router.put('/:id', authorize(['admin', 'organizer']), updateEvent);
router.delete('/:id', authorize(['admin', 'organizer']), deleteEvent);
router.post('/:id/publish', authorize(['admin', 'organizer']), publishEvent);
router.post('/:id/unpublish', authorize(['admin', 'organizer']), unpublishEvent);

export default router;
