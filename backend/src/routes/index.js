import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import eventRoutes from './event.routes.js';
import teamRoutes from './team.routes.js';
import submissionRoutes from './submission.routes.js';
import evaluationRoutes from './evaluation.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/teams', teamRoutes);
router.use('/submissions', submissionRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

export const configureRoutes = (app) => {
  app.use('/api', router);
};

export default router;
