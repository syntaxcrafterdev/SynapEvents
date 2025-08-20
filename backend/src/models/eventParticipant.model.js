import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const EventParticipant = sequelize.define('EventParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('participant', 'organizer', 'judge'),
    defaultValue: 'participant',
  },
  status: {
    type: DataTypes.ENUM('registered', 'checked_in', 'waitlisted', 'withdrawn'),
    defaultValue: 'registered',
  },
  checkedInAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  registrationData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional registration form data',
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
    {
      fields: ['checkedInAt'],
    },
  ],
});

// Class methods
EventParticipant.associate = (models) => {
  EventParticipant.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
  
  EventParticipant.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  EventParticipant.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team',
  });
  
  EventParticipant.hasMany(models.Submission, {
    foreignKey: 'submittedById',
    as: 'submissions',
  });
  
  EventParticipant.hasMany(models.Evaluation, {
    foreignKey: 'judgeId',
    as: 'evaluations',
  });
};

// Hooks
EventParticipant.beforeCreate(async (participant) => {
  // If this is an organizer or judge, automatically set status to registered
  if (['organizer', 'judge'].includes(participant.role)) {
    participant.status = 'registered';
  }
  
  // If this is a judge, ensure the user is also added to the EventJudge table
  if (participant.role === 'judge') {
    await participant.sequelize.models.EventJudge.findOrCreate({
      where: {
        eventId: participant.eventId,
        userId: participant.userId,
      },
      defaults: {
        role: 'judge',
        status: 'accepted',
        invitedById: participant.userId, // Self-invited
        respondedAt: new Date(),
      },
    });
  }
});

// Instance methods
EventParticipant.prototype.checkIn = async function() {
  if (this.status === 'checked_in') {
    return this;
  }
  
  this.status = 'checked_in';
  this.checkedInAt = new Date();
  return this.save();
};

EventParticipant.prototype.withdraw = async function() {
  if (this.status === 'withdrawn') {
    return this;
  }
  
  this.status = 'withdrawn';
  
  // If the participant is in a team, remove them
  if (this.teamId) {
    await this.sequelize.models.TeamMember.destroy({
      where: {
        teamId: this.teamId,
        userId: this.userId,
      },
    });
    
    // Check if the team is now empty and delete it if so
    const team = await this.sequelize.models.Team.findByPk(this.teamId, {
      include: [{
        model: this.sequelize.models.TeamMember,
        as: 'members',
        where: { status: 'accepted' },
        required: false,
      }],
    });
    
    if (team && team.members.length === 0) {
      await team.destroy();
    }
  }
  
  return this.save();
};

// Class methods for queries
EventParticipant.findByEvent = function(eventId, options = {}) {
  const defaults = {
    where: { eventId },
    include: [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: this.sequelize.models.Team,
        as: 'team',
        attributes: ['id', 'name'],
      },
    ],
    order: [
      ['role', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  };
  
  return this.findAll({ ...defaults, ...options });
};

EventParticipant.findByUser = function(userId, options = {}) {
  const defaults = {
    where: { userId },
    include: [
      {
        model: this.sequelize.models.Event,
        as: 'event',
        attributes: ['id', 'title', 'startDate', 'endDate', 'bannerImage', 'status'],
      },
      {
        model: this.sequelize.models.Team,
        as: 'team',
        attributes: ['id', 'name'],
      },
    ],
    order: [
      [{ model: this.sequelize.models.Event, as: 'event' }, 'startDate', 'DESC'],
    ],
  };
  
  return this.findAll({ ...defaults, ...options });
};

EventParticipant.getStats = async function(eventId) {
  const result = await this.findAll({
    where: { eventId },
    attributes: [
      'role',
      'status',
      [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
    ],
    group: ['role', 'status'],
    raw: true,
  });
  
  const stats = {
    total: 0,
    byRole: {},
    byStatus: {},
  };
  
  result.forEach(row => {
    const { role, status, count } = row;
    const countNum = parseInt(count, 10);
    
    // Update total
    stats.total += countNum;
    
    // Update by role
    if (!stats.byRole[role]) {
      stats.byRole[role] = 0;
    }
    stats.byRole[role] += countNum;
    
    // Update by status
    if (!stats.byStatus[status]) {
      stats.byStatus[status] = 0;
    }
    stats.byStatus[status] += countNum;
  });
  
  return stats;
};

export { EventParticipant };
