import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const EventJudge = sequelize.define('EventJudge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('judge', 'mentor', 'reviewer'),
    defaultValue: 'judge',
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
  invitedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
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
      fields: ['eventId', 'userId'],
      unique: true,
    },
    {
      fields: ['status'],
    },
  ],
});

// Class methods
EventJudge.associate = (models) => {
  EventJudge.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
  
  EventJudge.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'judge',
  });
  
  EventJudge.belongsTo(models.User, {
    foreignKey: 'invitedById',
    as: 'invitedBy',
  });
  
  EventJudge.hasMany(models.Evaluation, {
    foreignKey: 'judgeId',
    as: 'evaluations',
  });
};

// Hooks
EventJudge.beforeCreate(async (eventJudge) => {
  // Set invitedAt timestamp
  if (!eventJudge.invitedAt) {
    eventJudge.invitedAt = new Date();
  }
});

EventJudge.beforeUpdate(async (eventJudge) => {
  // Set respondedAt timestamp when status changes to accepted or rejected
  if (
    eventJudge.changed('status') && 
    ['accepted', 'rejected'].includes(eventJudge.status) &&
    !eventJudge.respondedAt
  ) {
    eventJudge.respondedAt = new Date();
  }
});

// Instance methods
EventJudge.prototype.acceptInvitation = async function() {
  if (this.status !== 'pending') {
    throw new Error('Invitation has already been responded to');
  }
  
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this.save();
};

EventJudge.prototype.rejectInvitation = async function() {
  if (this.status !== 'pending') {
    throw new Error('Invitation has already been responded to');
  }
  
  this.status = 'rejected';
  this.respondedAt = new Date();
  return this.save();
};

// Class methods for queries
EventJudge.findByEvent = function(eventId, options = {}) {
  return this.findAll({
    where: { eventId },
    include: [
      {
        model: this.sequelize.models.User,
        as: 'judge',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: this.sequelize.models.User,
        as: 'invitedBy',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [
      ['role', 'ASC'],
      ['createdAt', 'ASC'],
    ],
    ...options,
  });
};

EventJudge.findByJudge = function(judgeId, options = {}) {
  return this.findAll({
    where: { userId: judgeId },
    include: [
      {
        model: this.sequelize.models.Event,
        as: 'event',
        attributes: ['id', 'title', 'startDate', 'endDate', 'bannerImage'],
      },
    ],
    order: [
      [{ model: this.sequelize.models.Event, as: 'event' }, 'startDate', 'DESC'],
    ],
    ...options,
  });
};

EventJudge.findPendingInvitations = function(judgeId, options = {}) {
  return this.findAll({
    where: { 
      userId: judgeId,
      status: 'pending',
    },
    include: [
      {
        model: this.sequelize.models.Event,
        as: 'event',
        attributes: ['id', 'title', 'startDate', 'endDate', 'bannerImage'],
      },
      {
        model: this.sequelize.models.User,
        as: 'invitedBy',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [
      ['invitedAt', 'DESC'],
    ],
    ...options,
  });
};

export { EventJudge };
