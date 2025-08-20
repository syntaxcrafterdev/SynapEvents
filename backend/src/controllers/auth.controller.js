import { User } from '../models/user.model.js';
import { generateAuthTokens, comparePasswords, hashPassword, generateRandomToken, generateVerificationCode } from '../utils/auth.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../services/email.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [participant, organizer, admin]
 *                 default: participant
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please check your email to verify your account.
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already in use
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'participant' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerificationToken: generateRandomToken(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Generate tokens
    const { accessToken, refreshToken, user: userData } = generateAuthTokens(user);

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        template: 'verify-email',
        context: {
          name: user.name,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`,
        },
      });
    } catch (error) {
      logger.error(`Failed to send verification email: ${error.message}`);
      // Don't fail the request if email sending fails
    }

    // Return user data and tokens
    res.status(201).json({
      success: true,
      data: {
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access:
 *                           type: object
 *                           properties:
 *                             token:
 *                               type: string
 *                             expires:
 *                               type: string
 *                               format: date-time
 *                         refresh:
 *                           type: object
 *                           properties:
 *                             token:
 *                               type: string
 *                             expires:
 *                               type: string
 *                               format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 *       404:
 *         description: User not found
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.scope('withPassword').findOne({ where: { email } });

    // Check if user exists and password is correct
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified (if required)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken, user: userData } = generateAuthTokens(user);

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                         expires:
 *                           type: string
 *                           format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid refresh token
 *       403:
 *         description: Refresh token was expired or invalid
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = generateAuthTokens(user);

    // Return new tokens
    res.json({
      success: true,
      data: {
        user: userData,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const logout = async (req, res, next) => {
  try {
    // If using token blacklist, you would add the token to the blacklist here
    // await TokenBlacklist.create({ token: req.token });

    res.json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // If user exists, generate reset token and send email
    if (user) {
      const resetToken = generateRandomToken();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your password',
          template: 'reset-password',
          context: {
            name: user.name,
            resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
            expiresIn: '1 hour',
          },
        });
      } catch (error) {
        logger.error(`Failed to send password reset email: ${error.message}`);
        // Don't fail the request if email sending fails
      }
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password changed successfully',
        template: 'password-changed',
        context: {
          name: user.name,
        },
      });
    } catch (error) {
      logger.error(`Failed to send password changed email: ${error.message}`);
      // Don't fail the request if email sending fails
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    // Find user by verification token
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Redirect to success page or return success response
    if (req.accepts('html')) {
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified`);
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = generateRandomToken();
    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        template: 'verify-email',
        context: {
          name: user.name,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
        },
      });
    } catch (error) {
      logger.error(`Failed to send verification email: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }

    res.json({
      success: true,
      message: 'Verification email has been sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    if (!(await comparePasswords(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password changed',
        template: 'password-changed',
        context: {
          name: user.name,
        },
      });
    } catch (error) {
      logger.error(`Failed to send password changed email: ${error.message}`);
      // Don't fail the request if email sending fails
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
