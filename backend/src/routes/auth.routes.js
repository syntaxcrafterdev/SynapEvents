import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, logout } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Register a new user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('role')
      .optional()
      .isIn(['participant', 'organizer', 'judge'])
      .withMessage('Invalid role'),
  ],
  validateRequest,
  register
);

// Login user
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// Refresh access token
router.post('/refresh-token', refreshToken);

// Logout user
router.post('/logout', logout);

// Forgot password
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],
  validateRequest,
  resetPassword
);

// Verify email
router.get(
  '/verify-email',
  [
    query('token').notEmpty().withMessage('Token is required'),
  ],
  validateRequest,
  verifyEmail
);

// Resend verification email
router.post(
  '/resend-verification',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  resendVerificationEmail
);

// OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect or respond with tokens
    const token = req.user.generateAuthToken();
    const refreshToken = req.user.generateRefreshToken();
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  }
);

router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
  session: false,
}));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect or respond with tokens
    const token = req.user.generateAuthToken();
    const refreshToken = req.user.generateRefreshToken();
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  }
);

export default router;
