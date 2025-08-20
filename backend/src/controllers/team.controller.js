import { Team, TeamMember } from '../models/team.model.js';
import { User } from '../models/user.model.js';
import { Event } from '../models/event.model.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     description: Create a new team for an event. The creator becomes the team leader.
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - name
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event this team is for
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Name of the team
 *               description:
 *                 type: string
 *                 description: Team description (optional)
 *     responses:
 *       201:
 *         description: Team created successfully
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
 *                   example: Team created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User already in a team for this event
 *       404:
 *         description: Event not found or registration closed
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const createTeam = async (req, res) => {
  try {
    const { eventId, name, description } = req.body;

    // Check if event exists and is accepting registrations
    const event = await Event.findByPk(eventId);
    if (!event || !event.isRegistrationOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Event not found or registration is closed'
      });
    }

    // Check if user is already in a team for this event
    const existingTeam = await TeamMember.findOne({
      where: {
        userId: req.user.id,
        '$Team.eventId$': eventId,
        status: 'accepted'
      },
      include: [{
        model: Team,
        as: 'Team',
        required: true
      }]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this event'
      });
    }

    // Create team
    const team = await Team.create({
      eventId,
      name,
      description,
      leaderId: req.user.id,
      status: 'active'
    });

    // Add creator as team member with admin role
    await TeamMember.create({
      teamId: team.id,
      userId: req.user.id,
      role: 'admin',
      status: 'accepted'
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Create team error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists in this event'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create team'
    });
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team details
 *     description: Retrieve team details including members and event information
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this team
 *       404:
 *         description: Team not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'startDate', 'endDate', 'isOnline', 'location']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: ['role', 'status'] }
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team or an admin
    const isMember = await team.isMember(req.user.id);
    const isEventOrganizer = await Event.count({
      where: {
        id: team.eventId,
        organizerId: req.user.id
      }
    }) > 0;

    if (!isMember && !req.user.roles.includes('admin') && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this team'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team'
    });
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update team details
 *     description: Update team details including name, description, and logo
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Team name
 *               description:
 *                 type: string
 *                 description: Team description
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Team logo
 *     responses:
 *       200:
 *         description: Team details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this team
 *       404:
 *         description: Team not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo } = req.body;

    const team = await Team.findByPk(id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader or admin
    const isLeader = team.leaderId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isEventOrganizer = await Event.count({
      where: {
        id: team.eventId,
        organizerId: req.user.id
      }
    }) > 0;

    if (!isLeader && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this team'
      });
    }

    // Prevent updating locked teams
    if (team.isLocked && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Team is locked and cannot be modified'
      });
    }

    // Update team
    await team.update({
      name: name || team.name,
      description: description !== undefined ? description : team.description,
      logo: logo !== undefined ? logo : team.logo
    });

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Update team error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists in this event'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update team'
    });
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete a team
 *     description: Delete a team and all its members
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
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
 *                   example: Team deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this team
 *       404:
 *         description: Team not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
      include: [{
        model: Event,
        as: 'event'
      }]
    });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check permissions
    const isLeader = team.leaderId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isEventOrganizer = team.event.organizerId === req.user.id;

    if (!isLeader && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this team'
      });
    }

    // Soft delete the team
    await team.destroy();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    logger.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team'
    });
  }
};

/**
 * @swagger
 * /api/teams/join:
 *   post:
 *     summary: Join a team using invite code
 *     description: Join a team using a valid invite code. Requires authentication.
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 description: The invite code for the team
 *     responses:
 *       200:
 *         description: Successfully requested to join the team
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
 *                   example: Join request submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/TeamMember'
 *       400:
 *         description: Invalid invite code or team full
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Already in a team for this event
 *       404:
 *         description: Team not found or invite code expired
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    // Find team by invite code
    const team = await Team.findOne({
      where: {
        inviteCode,
        inviteExpires: { [Op.gt]: new Date() },
        isLocked: false
      },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'title', 'registrationEnd', 'maxTeamSize']
      }]
    });

    if (!team) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invite code'
      });
    }

    // Check if event registration is still open
    if (new Date(team.event.registrationEnd) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event registration is closed'
      });
    }

    // Check if user is already in a team for this event
    const existingTeam = await TeamMember.findOne({
      where: {
        userId: req.user.id,
        '$Team.eventId$': team.eventId,
        status: 'accepted'
      },
      include: [{
        model: Team,
        as: 'Team',
        required: true
      }]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this event'
      });
    }

    // Check if team is full
    const memberCount = await team.countMembers();
    if (memberCount >= (team.event.maxTeamSize || 5)) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if user has already requested to join
    const existingRequest = await TeamMember.findOne({
      where: {
        teamId: team.id,
        userId: req.user.id,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this team'
      });
    }

    // Add user to team as pending member
    await TeamMember.create({
      teamId: team.id,
      userId: req.user.id,
      role: 'member',
      status: team.event.requiresApproval ? 'pending' : 'accepted'
    });

    const message = team.event.requiresApproval 
      ? 'Join request sent to team leader for approval'
      : 'Successfully joined the team';

    res.json({
      success: true,
      message,
      data: {
        teamId: team.id,
        status: team.event.requiresApproval ? 'pending' : 'accepted'
      }
    });
  } catch (error) {
    logger.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team'
    });
  }
};

/**
 * Get team members
 * @route GET /teams/:id/members
 * @access Private (Team Members/Event Organizer/Admin)
 */
export const getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id, {
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'organizerId']
      }]
    });
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check permissions
    const isMember = await team.isMember(req.user.id);
    const isAdmin = req.user.roles.includes('admin');
    const isEventOrganizer = team.event.organizerId === req.user.id;

    if (!isMember && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view team members'
      });
    }

    const members = await TeamMember.findAll({
      where: { teamId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    logger.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members'
    });
  }
};

/**
 * Update team member status (approve/reject/remove)
 * @route PUT /teams/:teamId/members/:userId
 * @access Private (Team Admin/Leader)
 */
export const updateTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { status, role } = req.body;

    // Find team and check if user is leader/admin
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if requester is team leader or admin
    const isLeader = team.leaderId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isEventOrganizer = await Event.count({
      where: {
        id: team.eventId,
        organizerId: req.user.id
      }
    }) > 0;

    if (!isLeader && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update team members'
      });
    }

    // Find the team member
    const teamMember = await TeamMember.findOne({
      where: { teamId, userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent modifying own status/role if not admin
    if (userId === req.user.id && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify your own status/role'
      });
    }

    // Prevent removing the last admin
    if (teamMember.role === 'admin' && (status === 'removed' || role !== 'admin')) {
      const adminCount = await TeamMember.count({
        where: {
          teamId,
          role: 'admin',
          status: 'accepted',
          userId: { [Op.ne]: userId } // Exclude current user from count
        }
      });

      if (adminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'A team must have at least one admin'
        });
      }
    }

    // Update member
    if (status) teamMember.status = status;
    if (role) teamMember.role = role;
    
    await teamMember.save();

    // If member is removed, update team leader if needed
    if (status === 'removed' && team.leaderId === userId) {
      // Find a new admin to promote to leader
      const newLeader = await TeamMember.findOne({
        where: {
          teamId,
          role: 'admin',
          status: 'accepted',
          userId: { [Op.ne]: userId }
        },
        order: [['createdAt', 'ASC']]
      });

      if (newLeader) {
        team.leaderId = newLeader.userId;
        await team.save();
      } else {
        // If no other admin, make the team inactive
        team.status = 'inactive';
        await team.save();
      }
    }

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: teamMember
    });
  } catch (error) {
    logger.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member'
    });
  }
};

/**
 * Regenerate team invite code
 * @route POST /teams/:id/regenerate-invite
 * @access Private (Team Admin/Leader)
 */
export const regenerateInviteCode = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader or admin
    const isLeader = team.leaderId === req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    const isEventOrganizer = await Event.count({
      where: {
        id: team.eventId,
        organizerId: req.user.id
      }
    }) > 0;

    if (!isLeader && !isAdmin && !isEventOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to regenerate invite code'
      });
    }

    // Regenerate invite code
    const newInviteCode = await team.renewInviteCode();

    res.json({
      success: true,
      message: 'Invite code regenerated successfully',
      data: {
        inviteCode: newInviteCode,
        inviteExpires: team.inviteExpires
      }
    });
  } catch (error) {
    logger.error('Regenerate invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate invite code'
    });
  }
};
