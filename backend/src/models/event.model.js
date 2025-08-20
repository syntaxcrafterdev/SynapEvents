import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200],
    },
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  bannerImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      },
    },
  },
  registrationStart: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  registrationEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterRegistrationStart(value) {
        if (value <= this.registrationStart) {
          throw new Error('Registration end must be after registration start');
        }
      },
      isBeforeEventStart(value) {
        if (value >= this.startDate) {
          throw new Error('Registration must end before the event starts');
        }
      },
    },
  },
  submissionDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isBeforeEndDate(value) {
        if (value && value > this.endDate) {
          throw new Error('Submission deadline must be before the event ends');
        }
      },
    },
  },
  maxTeamSize: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 10,
    },
  },
  minTeamSize: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      maxTeamSize(value) {
        if (value > this.maxTeamSize) {
          throw new Error('Min team size cannot be greater than max team size');
        }
      },
    },
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  onlineLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  status: {
    type: DataTypes.ENUM('draft', 'upcoming', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'draft',
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rules: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  prizes: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  schedule: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  sponsors: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  judgingCriteria: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  registrationFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
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
      fields: ['slug'],
      unique: true,
    },
    {
      fields: ['status'],
    },
    {
      fields: ['startDate', 'endDate'],
    },
    {
      fields: ['isPublished'],
    },
  ],
});

// Hooks
Event.beforeCreate((event) => {
  if (event.isPublished && !event.publishedAt) {
    event.publishedAt = new Date();
  }
});

Event.beforeUpdate((event) => {
  if (event.changed('isPublished') && event.isPublished && !event.publishedAt) {
    event.publishedAt = new Date();
  }
});

// Instance methods
Event.prototype.isRegistrationOpen = function() {
  const now = new Date();
  return now >= this.registrationStart && now <= this.registrationEnd;
};

Event.prototype.isSubmissionOpen = function() {
  if (!this.submissionDeadline) return false;
  const now = new Date();
  return now <= this.submissionDeadline && now <= this.endDate;
};

Event.prototype.isEventOngoing = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Class methods
Event.associate = (models) => {
  Event.belongsTo(models.User, {
    foreignKey: 'organizerId',
    as: 'organizer',
  });
  
  Event.hasMany(models.Team, {
    foreignKey: 'eventId',
    as: 'teams',
  });
  
  Event.hasMany(models.EventJudge, {
    foreignKey: 'eventId',
    as: 'judges',
  });
  
  Event.hasMany(models.Announcement, {
    foreignKey: 'eventId',
    as: 'announcements',
  });
  
  Event.hasMany(models.Submission, {
    foreignKey: 'eventId',
    as: 'submissions',
  });
};

export { Event };
