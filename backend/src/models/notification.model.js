import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM(
      'event_created',
      'event_updated',
      'event_cancelled',
      'team_invite',
      'team_join_request',
      'team_join_approved',
      'team_join_rejected',
      'submission_received',
      'submission_updated',
      'evaluation_received',
      'announcement',
      'comment',
      'mention',
      'system',
      'other'
    ),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  referenceType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The type of the referenced entity (e.g., event, submission, team)',
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'The ID of the referenced entity',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['isRead'],
    },
    {
      fields: ['createdAt'],
    },
    {
      fields: ['referenceType', 'referenceId'],
    },
  ],
});

// Class methods
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  Notification.belongsTo(models.User, {
    foreignKey: 'triggeredById',
    as: 'triggeredBy',
  });
};

// Hooks
Notification.beforeUpdate(async (notification) => {
  // Set readAt timestamp when isRead changes to true
  if (notification.changed('isRead') && notification.isRead && !notification.readAt) {
    notification.readAt = new Date();
  }
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

Notification.prototype.markAsUnread = async function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = null;
    await this.save();
  }
  return this;
};

// Class methods for queries
Notification.findByUser = function(userId, options = {}) {
  const defaults = {
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  };
  
  return this.findAll({ ...defaults, ...options });
};

Notification.findUnreadCount = function(userId, options = {}) {
  return this.count({
    where: { 
      userId,
      isRead: false,
    },
    ...options,
  });
};

Notification.markAllAsRead = function(userId, options = {}) {
  return this.update(
    { 
      isRead: true,
      readAt: new Date(),
    },
    {
      where: { 
        userId,
        isRead: false,
      },
      ...options,
    }
  );
};

// Static methods for common notification types
Notification.createEventCreated = async (event, options = {}) => {
  const { User, EventParticipant } = this.sequelize.models;
  
  // Get all users who should be notified
  const participants = await EventParticipant.findAll({
    where: { eventId: event.id },
    attributes: ['userId'],
    raw: true,
  });
  
  if (participants.length === 0) return [];
  
  const notifications = participants.map(participant => ({
    userId: participant.userId,
    type: 'event_created',
    title: `New Event: ${event.title}`,
    message: `A new event "${event.title}" has been created.`,
    referenceType: 'event',
    referenceId: event.id,
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
    },
  }));
  
  return this.bulkCreate(notifications, options);
};

Notification.createTeamInvite = async (team, invitedUser, inviter, options = {}) => {
  return this.create({
    userId: invitedUser.id,
    type: 'team_invite',
    title: 'Team Invitation',
    message: `You've been invited to join the team "${team.name}" by ${inviter.name}.`,
    referenceType: 'team',
    referenceId: team.id,
    triggeredById: inviter.id,
    metadata: {
      teamId: team.id,
      teamName: team.name,
      inviterId: inviter.id,
      inviterName: inviter.name,
    },
  }, options);
};

Notification.createSubmissionReceived = async (submission, event, options = {}) => {
  const { EventJudge } = this.sequelize.models;
  
  // Get all judges for the event
  const judges = await EventJudge.findAll({
    where: { 
      eventId: event.id,
      status: 'accepted',
    },
    attributes: ['userId'],
    raw: true,
  });
  
  if (judges.length === 0) return [];
  
  const notifications = judges.map(judge => ({
    userId: judge.userId,
    type: 'submission_received',
    title: 'New Submission Received',
    message: `A new submission "${submission.title}" has been received for "${event.title}".`,
    referenceType: 'submission',
    referenceId: submission.id,
    metadata: {
      submissionId: submission.id,
      submissionTitle: submission.title,
      eventId: event.id,
      eventTitle: event.title,
    },
  }));
  
  return this.bulkCreate(notifications, options);
};

export { Notification };
