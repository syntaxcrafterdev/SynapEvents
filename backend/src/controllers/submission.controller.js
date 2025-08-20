import { Submission, Evaluation } from '../models/submission.model.js';
import { Team, TeamMember } from '../models/team.model.js';
import { Event, EventJudge } from '../models/event.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';
import { uploadToStorage } from '../services/storage.service.js';

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Create a new submission
 *     description: Submit a new project for an event. Requires team membership and event participation.
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - title
 *               - description
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the team making the submission
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Title of the submission
 *               description:
 *                 type: string
 *                 description: Detailed description of the submission
 *               githubUrl:
 *                 type: string
 *                 format: uri
 *                 description: Link to GitHub repository
 *               demoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Link to live demo
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Link to video demo
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of technologies used
 *               submissionFile:
 *                 type: string
 *                 format: binary
 *                 description: Project file (zip, pdf, etc.)
 *     responses:
 *       201:
 *         description: Submission created successfully
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
 *                   example: Submission created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to submit for this team/event
 *       404:
 *         description: Event or team not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const createSubmission = async (req, res) => {
  try {
    const { eventId, teamId, title, description, githubUrl, videoUrl, submissionNote, isPublic } = req.body;
    const file = req.file;

    // Check if event exists and accepts submissions
    const event = await Event.findByPk(eventId);
    if (!event || !event.isSubmissionOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Event not found or submissions are closed'
      });
    }

    // Check if team exists and user is a member
    const team = await Team.findByPk(teamId, {
      include: [{
        model: TeamMember,
        where: { userId: req.user.id, status: 'accepted' },
        required: true
      }]
    });

    if (!team) {
      return res.status(403).json({
        success: false,
        message: 'Team not found or you are not a member'
      });
    }

    // Check if team has already submitted
    const existingSubmission = await Submission.findOne({
      where: {
        teamId,
        eventId,
        status: { [Op.ne]: 'draft' }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Your team has already submitted for this event'
      });
    }

    // Handle file upload if present
    let fileUrl, fileType, fileSize;
    if (file) {
      const uploadResult = await uploadToStorage(file, {
        folder: `submissions/event-${eventId}/team-${teamId}`,
        public: isPublic
      });
      
      fileUrl = uploadResult.url;
      fileType = file.mimetype;
      fileSize = file.size;
    }

    // Create submission
    const submission = await Submission.create({
      eventId,
      teamId,
      submittedById: req.user.id,
      title,
      description,
      githubUrl,
      videoUrl,
      fileUrl,
      fileType,
      fileSize,
      submissionNote,
      isPublic: isPublic || false,
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
    });
  } catch (error) {
    logger.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Get all submissions (Admin/Organizer/Judge)
 *     description: Retrieve a paginated list of all submissions with filtering options
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
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
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by event ID
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, approved, rejected]
 *         description: Filter by submission status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *     responses:
 *       200:
 *         description: List of submissions retrieved successfully
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const listEventSubmissions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, teamId, judgeId, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    // Check if user has permission to view submissions
    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: EventJudge,
          where: { userId: req.user.id, status: 'accepted' },
          required: false,
          as: 'judges'
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isEventOrganizer = event.organizerId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isJudge = event.judges?.length > 0;

    if (!isEventOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions for this event'
      });
    }

    // Build query
    const where = { eventId };
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;

    const include = [
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      },
      {
        model: User,
        as: 'submittedBy',
        attributes: ['id', 'name', 'email']
      }
    ];

    // If judge, only show submissions they're assigned to evaluate
    if (isJudge && !isAdmin && !isEventOrganizer) {
      include.push({
        model: Evaluation,
        as: 'evaluations',
        where: { judgeId: req.user.id },
        required: false
      });

      // Only show submissions that have been assigned to this judge
      where['$evaluations.judgeId$'] = req.user.id;
    }

    // Add evaluations count and average score
    include.push({
      model: Evaluation,
      as: 'evaluations',
      attributes: [],
      required: false
    });

    const submissions = await Submission.findAll({
      where,
      include,
      attributes: {
        include: [
          [
            sequelize.fn('COUNT', sequelize.col('evaluations.id')),
            'evaluationCount'
          ],
          [
            sequelize.fn('AVG', sequelize.col('evaluations.score')),
            'averageScore'
          ]
        ]
      },
      group: ['Submission.id'],
      order: [[sortBy, sortOrder.toUpperCase()]],
      subQuery: false
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    logger.error('List submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions'
    });
  }
};

/**
 * @swagger
 * /api/submissions/{id}/evaluations:
 *   post:
 *     summary: Submit evaluation for a submission
 *     description: Submit evaluation scores and feedback for a submission. Available to judges, organizers, and admins.
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - feedback
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Numeric score (0-100)
 *               feedback:
 *                 type: string
 *                 description: Detailed feedback
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - score
 *                   properties:
 *                     name:
 *                       type: string
 *                     score:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 10
 *                     comment:
 *                       type: string
 *     responses:
 *       201:
 *         description: Evaluation submitted successfully
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
 *                   example: Evaluation submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to evaluate this submission
 *       404:
 *         description: Submission not found
 *       409:
 *         description: You have already evaluated this submission
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const submitEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback, criteria } = req.body;

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event',
          include: [{
            model: EventJudge,
            where: { userId: req.user.id, status: 'accepted' },
            required: false,
            as: 'judges'
          }]
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check permissions
    const isEventOrganizer = submission.event.organizerId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isJudge = submission.event.judges?.length > 0;

    if (!isEventOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to evaluate this submission'
      });
    }

    // Check if judging is still open
    if (new Date() > new Date(submission.event.judgingEnd) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Judging period has ended'
      });
    }

    // Create or update evaluation
    const [evaluation, created] = await Evaluation.upsert(
      {
        submissionId: id,
        judgeId: req.user.id,
        score,
        feedback,
        criteria,
        status: 'submitted'
      },
      {
        conflictFields: ['submissionId', 'judgeId'],
        returning: true
      }
    );

    // Recalculate submission scores
    await submission.calculateScores();

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Evaluation submitted' : 'Evaluation updated',
      data: evaluation
    });
  } catch (error) {
    logger.error('Submit evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evaluation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get leaderboard for an event
 * @route GET /events/:eventId/leaderboard
 * @access Public (or restricted based on event settings)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if leaderboard is public
    if (!event.isLeaderboardPublic && !req.user?.roles?.includes('admin') && 
        event.organizerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Leaderboard is not public for this event'
      });
    }

    // Get submissions with evaluation counts and average scores
    const submissions = await Submission.findAll({
      where: {
        eventId,
        status: 'submitted'
      },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name']
        },
        {
          model: Evaluation,
          as: 'evaluations',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id',
        'title',
        'createdAt',
        [
          sequelize.fn('COUNT', sequelize.col('evaluations.id')),
          'evaluationCount'
        ],
        [
          sequelize.fn('AVG', sequelize.col('evaluations.score')),
          'averageScore'
        ]
      ],
      group: ['Submission.id'],
      order: [
        [sequelize.literal('"averageScore"'), 'DESC NULLS LAST'],
        [sequelize.literal('"evaluationCount"'), 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });

    // Add rank to each submission
    const rankedSubmissions = submissions.map((submission, index) => ({
      ...submission.get({ plain: true }),
      rank: offset + index + 1
    }));

    // Get total count for pagination
    const total = await Submission.count({
      where: {
        eventId,
        status: 'submitted'
      }
    });

    res.json({
      success: true,
      data: {
        submissions: rankedSubmissions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};
