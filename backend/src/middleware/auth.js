import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { User } from '../models/user.model.js';
import { TokenBlacklist } from '../models/tokenBlacklist.model.js';
import { EventParticipant } from '../models/eventParticipant.model.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to authenticate user using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ where: { token } });
    if (isBlacklisted) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // If roles is empty, allow any authenticated user
    if (roles.length === 0) {
      return next();
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource
 * @param {string} modelName - Name of the model to check ownership
 * @param {string} [idParam='id'] - Name of the route parameter containing the resource ID
 * @returns {Function} Express middleware function
 */
export const isOwner = (modelName, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}.model.js`).default;
      const resource = await Model.findByPk(req.params[idParam]);

      if (!resource) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Check if user is the owner or an admin
      if (resource.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to access this resource',
        });
      }

      // Attach resource to request object
      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to verify ownership',
      });
    }
  };
};

/**
 * Middleware to check if user is a participant of an event
 * @param {string} [idParam='eventId'] - Name of the route parameter containing the event ID
 * @returns {Function} Express middleware function
 */
export const isEventParticipant = (idParam = 'eventId') => {
  return async (req, res, next) => {
    try {
      const { EventParticipant } = require('../models/eventParticipant.model.js');
      
      const participant = await EventParticipant.findOne({
        where: {
          eventId: req.params[idParam],
          userId: req.user.id,
        },
      });

      if (!participant) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'You are not a participant of this event',
        });
      }

      // Attach participant data to request object
      req.participant = participant;
      next();
    } catch (error) {
      logger.error('Event participant check error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to verify event participation',
      });
    }
  };
};

/**
 * Middleware to check if user is an event organizer
 * @param {string} [idParam='eventId'] - Name of the route parameter containing the event ID
 * @returns {Function} Express middleware function
 */
export const isEventOrganizer = (idParam = 'eventId') => {
  return async (req, res, next) => {
    try {
      const { Event } = require('../models/event.model.js');
      
      const event = await Event.findByPk(req.params[idParam]);

      if (!event) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Check if user is the organizer or an admin
      if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'You are not authorized to perform this action',
        });
      }

      // Attach event to request object
      req.event = event;
      next();
    } catch (error) {
      logger.error('Event organizer check error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to verify event organizer status',
      });
    }
  };
};

/**
 * Middleware to check if user is a team member
 * @param {string} [idParam='teamId'] - Name of the route parameter containing the team ID
 * @returns {Function} Express middleware function
 */
export const isTeamMember = (idParam = 'teamId') => {
  return async (req, res, next) => {
    try {
      const { TeamMember } = require('../models/teamMember.model.js');
      
      const teamMember = await TeamMember.findOne({
        where: {
          teamId: req.params[idParam],
          userId: req.user.id,
          status: 'accepted',
        },
      });

      if (!teamMember) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'You are not a member of this team',
        });
      }

      // Attach team member data to request object
      req.teamMember = teamMember;
      next();
    } catch (error) {
      logger.error('Team member check error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to verify team membership',
      });
    }
  };
};

/**
 * Middleware to check if user is a team admin
 * @param {string} [idParam='teamId'] - Name of the route parameter containing the team ID
 * @returns {Function} Express middleware function
 */
export const isTeamAdmin = (idParam = 'teamId') => {
  return async (req, res, next) => {
    try {
      const { TeamMember } = require('../models/teamMember.model.js');
      
      const teamMember = await TeamMember.findOne({
        where: {
          teamId: req.params[idParam],
          userId: req.user.id,
          status: 'accepted',
          role: 'admin',
        },
      });

      if (!teamMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to perform this action',
        });
      }

      // Attach team member data to request object
      req.teamMember = teamMember;
      next();
    } catch (error) {
      logger.error('Team admin check error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to verify team admin status',
      });
    }
  };
};

// Removed duplicate checkOwnership and checkEventParticipation functions as they are redundant with isOwner and isEventParticipant
