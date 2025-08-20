import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  getTeamMembers,
  updateTeamMember,
  regenerateInviteCode
} from '../controllers/team.controller.js';

const router = Router();

// Protected routes (require authentication)
router.use(authenticate);

// Team management
router.post('/', createTeam);
router.get('/:id', getTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// Team membership
router.post('/join', joinTeam);
router.get('/:id/members', getTeamMembers);
router.put('/:teamId/members/:userId', updateTeamMember);

// Team invites
router.post('/:id/regenerate-invite', regenerateInviteCode);

// Admin routes
// Note: These routes are protected by the authorize middleware
// and will only be accessible to users with admin or organizer role
router.get('/', authorize(['admin', 'organizer']), async (req, res) => {
  // Implementation for admin to list all teams
  // This is a placeholder and should be implemented based on your requirements
  res.json({ message: 'List all teams (admin only)' });
});

export default router;
