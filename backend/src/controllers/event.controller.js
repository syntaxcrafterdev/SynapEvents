import { Event } from '../models/event.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event with the provided details. Requires admin or organizer role.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                   example: Event created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      submissionDeadline,
      maxTeamSize,
      minTeamSize,
      isOnline,
      location,
      onlineLink,
      rules,
      prizes,
      schedule,
      sponsors,
      judgingCriteria,
      tags,
      maxParticipants,
      registrationFee,
      currency,
      timezone,
      metadata
    } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');

    const event = await Event.create({
      title,
      slug,
      description,
      shortDescription,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      submissionDeadline,
      maxTeamSize,
      minTeamSize,
      isOnline,
      location: isOnline ? null : location,
      onlineLink: isOnline ? onlineLink : null,
      organizerId: req.user.id,
      rules: rules || [],
      prizes: prizes || [],
      schedule: schedule || [],
      sponsors: sponsors || [],
      judgingCriteria: judgingCriteria || [],
      tags: tags || [],
      maxParticipants,
      registrationFee: registrationFee || 0,
      currency: currency || 'USD',
      timezone: timezone || 'UTC',
      metadata: metadata || {},
      status: 'draft',
      isPublished: false
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Create event error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'An event with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a paginated list of events with optional filtering and sorting
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, draft]
 *         description: Filter by event status
 *       - in: query
 *         name: isOnline
 *         schema:
 *           type: boolean
 *         description: Filter by online/offline events
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: startDate
 *           enum: [startDate, endDate, createdAt, title]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: asc
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of events
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
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
/**
 * Get all events with filtering and pagination
 * @async
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      isPublished,
      isOnline,
      search,
      sortBy = 'startDate',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (isPublished) where.isPublished = isPublished === 'true';
    if (isOnline) where.isOnline = isOnline === 'true';
    
    // Search in title and description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Only show published events to non-authenticated users
    if (!req.user) {
      where.isPublished = true;
      where.status = { [Op.in]: ['upcoming', 'ongoing'] };
    } else if (!req.user.roles.includes('admin') && !req.user.roles.includes('organizer')) {
      // For regular users, only show published events or events they're participating in
      where[Op.or] = [
        { isPublished: true },
        { '$participants.userId$': req.user.id }
      ];
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id'],
          through: { attributes: [] },
          required: false
        }
      ],
      distinct: true
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
};

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID or slug
 *     description: Retrieve event details by ID or slug
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID or slug
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
/**
 * Get a single event by ID or slug
 * @async
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const where = {};

    // Check if ID is a UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    where[isUuid ? 'id' : 'slug'] = id;

    // Only show published events to non-authenticated users
    if (!req.user) {
      where.isPublished = true;
    }

    const event = await Event.findOne({
      where,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'avatar', 'bio']
        },
        {
          model: User,
          as: 'judges',
          attributes: ['id', 'name', 'email', 'avatar', 'title', 'company'],
          through: { attributes: ['role', 'status'] }
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: ['role', 'status'] },
          required: false
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if the event is published or user has access
    if (!event.isPublished && req.user?.id !== event.organizerId && !req.user?.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this event'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
};

/**
 * Update an event
 * @route PUT /events/:id
 * @access Private (Admin/Organizer)
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer or admin
    if (event.organizerId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Prevent changing certain fields if event is published
    if (event.isPublished) {
      const restrictedFields = ['organizerId', 'slug', 'isPublished', 'status'];
      for (const field of restrictedFields) {
        if (updates[field] && updates[field] !== event[field]) {
          return res.status(400).json({
            success: false,
            message: `Cannot change ${field} for a published event`
          });
        }
      }
    }

    // Update event
    await event.update(updates);

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an event
 * @route DELETE /events/:id
 * @access Private (Admin/Organizer)
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer or admin
    if (event.organizerId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Soft delete the event
    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
};

/**
 * Publish an event
 * @route POST /events/:id/publish
 * @access Private (Admin/Organizer)
 */
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer or admin
    if (event.organizerId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this event'
      });
    }

    // Validate event before publishing
    const requiredFields = [
      'title', 'description', 'startDate', 'endDate',
      'registrationStart', 'registrationEnd', 'maxTeamSize', 'minTeamSize'
    ];
    
    const missingFields = requiredFields.filter(field => !event[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish event. Missing required fields',
        missingFields
      });
    }

    // Publish the event
    await event.update({
      isPublished: true,
      publishedAt: new Date(),
      status: 'upcoming'
    });

    res.json({
      success: true,
      message: 'Event published successfully',
      data: event
    });
  } catch (error) {
    logger.error('Publish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish event'
    });
  }
};

/**
 * Unpublish an event
 * @route POST /events/:id/unpublish
 * @access Private (Admin/Organizer)
 */
export const unpublishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer or admin
    if (event.organizerId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unpublish this event'
      });
    }

    // Unpublish the event
    await event.update({
      isPublished: false
    });

    res.json({
      success: true,
      message: 'Event unpublished successfully',
      data: event
    });
  } catch (error) {
    logger.error('Unpublish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish event'
    });
  }
};

/**
 * Register for an event
 * @route POST /events/:id/register
 * @access Private
 */
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId, role = 'participant', metadata = {} } = req.body;

    const event = await Event.findByPk(id);
    
    if (!event || !event.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not published'
      });
    }

    // Check if registration is open
    if (!event.isRegistrationOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event'
      });
    }

    // Check if user is already registered
    const existingRegistration = await event.getParticipants({
      where: { id: req.user.id }
    });

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event has reached max participants
    if (event.maxParticipants) {
      const participantCount = await event.countParticipants();
      if (participantCount >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Event has reached maximum capacity'
        });
      }
    }

    // Register user for the event
    await event.addParticipant(req.user.id, {
      through: {
        role,
        teamId,
        status: 'registered',
        metadata
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event'
    });
  } catch (error) {
    logger.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event'
    });
  }
};

/**
 * Get event participants
 * @route GET /events/:id/participants
 * @access Private (Admin/Organizer/Participant)
 */
export const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.query;

    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has access to participants
    if (
      event.organizerId !== req.user.id && 
      !req.user.roles.includes('admin') &&
      !(await event.hasParticipant(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view participants'
      });
    }

    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const participants = await event.getParticipants({
      where,
      attributes: ['id', 'name', 'email', 'avatar'],
      joinTableAttributes: ['role', 'status', 'createdAt']
    });

    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    logger.error('Get event participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event participants'
    });
  }
};
