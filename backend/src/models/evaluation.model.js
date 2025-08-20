import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  criteriaScores: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted'),
    defaultValue: 'draft',
  },
  round: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
    },
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
      fields: ['submissionId', 'judgeId', 'round'],
      unique: true,
      name: 'unique_judge_submission_round',
    },
    {
      fields: ['submissionId'],
    },
    {
      fields: ['judgeId'],
    },
    {
      fields: ['status'],
    },
  ],
});

// Class methods
Evaluation.associate = (models) => {
  Evaluation.belongsTo(models.Submission, {
    foreignKey: 'submissionId',
    as: 'submission',
  });
  
  Evaluation.belongsTo(models.User, {
    foreignKey: 'judgeId',
    as: 'judge',
  });
  
  Evaluation.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
};

// Hooks
Evaluation.beforeSave(async (evaluation) => {
  // If this is an update and score is being changed, recalculate submission average
  if (evaluation.changed('score') && evaluation.submissionId) {
    const submission = await evaluation.getSubmission();
    if (submission) {
      await submission.calculateScores();
    }
  }
});

// Instance methods
Evaluation.prototype.submit = async function() {
  if (this.status === 'submitted') {
    throw new Error('Evaluation has already been submitted');
  }
  
  // Validate all criteria scores are provided
  const submission = await this.getSubmission({
    include: [
      {
        model: this.sequelize.models.Event,
        as: 'event',
      },
    ],
  });
  
  const criteria = submission.event.judgingCriteria || [];
  const criteriaScores = this.criteriaScores || {};
  
  // Check if all criteria have been scored
  for (const criterion of criteria) {
    if (!(criterion.id in criteriaScores)) {
      throw new Error(`Score for criterion "${criterion.name}" is required`);
    }
    
    const score = parseFloat(criteriaScores[criterion.id]);
    if (isNaN(score) || score < 0 || score > criterion.maxScore) {
      throw new Error(`Invalid score for criterion "${criterion.name}"`);
    }
  }
  
  // Calculate total score if not provided
  if (!this.score) {
    this.score = Object.values(criteriaScores).reduce(
      (sum, score) => sum + parseFloat(score),
      0
    );
  }
  
  this.status = 'submitted';
  return this.save();
};

// Class methods for queries
Evaluation.findByJudge = function(judgeId, eventId, options = {}) {
  const where = { judgeId };
  if (eventId) where.eventId = eventId;
  
  return this.findAll({
    where,
    include: [
      {
        model: this.sequelize.models.Submission,
        as: 'submission',
        include: [
          {
            model: this.sequelize.models.Team,
            as: 'team',
            include: [
              {
                model: this.sequelize.models.User,
                as: 'members',
                through: { attributes: [] },
                attributes: ['id', 'name', 'email', 'avatar'],
              },
            ],
          },
        ],
      },
    ],
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
    ...options,
  });
};

Evaluation.findBySubmission = function(submissionId, options = {}) {
  return this.findAll({
    where: { submissionId },
    include: [
      {
        model: this.sequelize.models.User,
        as: 'judge',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
    ],
    order: [['createdAt', 'DESC']],
    ...options,
  });
};

Evaluation.getAverageScores = async function(eventId, round = 1) {
  const results = await this.findAll({
    where: {
      eventId,
      round,
      status: 'submitted',
    },
    attributes: [
      'submissionId',
      [this.sequelize.fn('AVG', this.sequelize.col('score')), 'averageScore'],
      [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'evaluationCount'],
    ],
    group: ['submissionId'],
    order: [[this.sequelize.fn('AVG', this.sequelize.col('score')), 'DESC']],
    raw: true,
  });
  
  return results.map((result, index) => ({
    rank: index + 1,
    submissionId: result.submissionId,
    averageScore: parseFloat(result.averageScore).toFixed(2),
    evaluationCount: parseInt(result.evaluationCount, 10),
  }));
};

export { Evaluation };
