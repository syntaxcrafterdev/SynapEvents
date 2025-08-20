import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected'),
    defaultValue: 'draft',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  submissionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // These fields will be calculated based on evaluations
  averageScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  totalEvaluations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['eventId', 'teamId'],
      unique: false,
    },
    {
      fields: ['status'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

// Class methods
Submission.associate = (models) => {
  Submission.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
  
  Submission.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team',
  });
  
  Submission.belongsTo(models.User, {
    foreignKey: 'submittedById',
    as: 'submittedBy',
  });
  
  Submission.hasMany(models.Evaluation, {
    foreignKey: 'submissionId',
    as: 'evaluations',
  });
  
  Submission.hasMany(models.Comment, {
    foreignKey: 'submissionId',
    as: 'comments',
  });
};

// Hooks
Submission.beforeCreate(async (submission) => {
  // If this is the first submission for the team, set as submitted
  if (submission.status === 'draft') {
    const count = await Submission.count({
      where: {
        teamId: submission.teamId,
        eventId: submission.eventId,
      },
    });
    
    if (count === 0) {
      submission.status = 'submitted';
    }
  }
});

// Instance methods
Submission.prototype.calculateScores = async function() {
  const evaluations = await this.getEvaluations();
  
  if (evaluations.length === 0) {
    this.averageScore = null;
    this.totalEvaluations = 0;
    return this.save();
  }
  
  const totalScore = evaluations.reduce((sum, evalItem) => {
    return sum + (evalItem.score || 0);
  }, 0);
  
  this.averageScore = totalScore / evaluations.length;
  this.totalEvaluations = evaluations.length;
  
  return this.save();
};

Submission.prototype.getLeaderboardPosition = async function() {
  // Get all submissions for this event with their average scores
  const submissions = await Submission.findAll({
    where: {
      eventId: this.eventId,
      status: 'submitted',
      averageScore: { [Op.ne]: null },
    },
    order: [['averageScore', 'DESC']],
    attributes: ['id', 'averageScore'],
  });
  
  // Find the position of this submission
  const position = submissions.findIndex(s => s.id === this.id);
  
  return position === -1 ? null : position + 1; // +1 because array is 0-indexed
};

// Class methods for queries
Submission.findByEvent = function(eventId, options = {}) {
  const defaultOptions = {
    where: { eventId },
    include: [
      {
        model: this.sequelize.models.Team,
        as: 'team',
        include: [
          {
            model: this.sequelize.models.User,
            as: 'members',
            through: { attributes: [] }, // Don't include junction table
            attributes: ['id', 'name', 'email', 'avatar'],
          },
        ],
      },
      {
        model: this.sequelize.models.Evaluation,
        as: 'evaluations',
        include: [
          {
            model: this.sequelize.models.User,
            as: 'judge',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
        ],
      },
    ],
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  };
  
  return this.findAll({ ...defaultOptions, ...options });
};

Submission.findByTeam = function(teamId, options = {}) {
  return this.findAll({
    where: { teamId },
    order: [['createdAt', 'DESC']],
    ...options,
  });
};

export { Submission };
