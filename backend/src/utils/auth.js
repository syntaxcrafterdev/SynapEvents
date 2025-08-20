import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * Generate JWT token
 * @param {Object} payload - The payload to sign
 * @param {string} secret - The JWT secret
 * @param {string|number} expiresIn - Expiration time (e.g., '1d', '7d', '30d')
 * @returns {string} JWT token
 */
export const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The JWT secret
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return null;
  }
};

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - The user object
 * @returns {Object} Tokens and user data
 */
export const generateAuthTokens = (user) => {
  const accessToken = generateToken(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN || '15m'
  );

  const refreshToken = generateToken(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

/**
 * Hash a password
 * @param {string} password - The password to hash
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param {string} password - The password to compare
 * @param {string} hashedPassword - The hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePasswords = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random token for email verification, password reset, etc.
 * @returns {string} Random token
 */
export const generateRandomToken = () => {
  return uuidv4();
};

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Set auth cookies in the response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // or 'lax' if you need to support external redirects
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

/**
 * Clear auth cookies from the response
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
