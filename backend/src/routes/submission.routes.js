import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createSubmission,
  getSubmission,
  updateSubmission,
  deleteSubmission,
  listEventSubmissions,
  submitEvaluation,
  getLeaderboard
} from '../controllers/submission.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/events/:eventId/leaderboard', getLeaderboard);

// Protected routes (require authentication)
router.use(authenticate);

// Submission management
router.post('/', 
  upload.single('file'),
  createSubmission
);

router.get('/:id', getSubmission);
router.put('/:id', 
  upload.single('file'),
  updateSubmission
);
router.delete('/:id', deleteSubmission);

// Event submissions
router.get('/events/:eventId/submissions', listEventSubmissions);

// Evaluations
router.post('/:id/evaluations', submitEvaluation);

// Admin routes
router.get('/', 
  authorize(['admin', 'organizer']), 
  (req, res) => res.json({ message: 'List all submissions (admin only)' })
);

export default router;
