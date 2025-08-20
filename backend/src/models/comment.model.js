import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000],
    },
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'If true, only visible to organizers/judges',
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
      fields: ['submissionId'],
    },
    {
      fields: ['announcementId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['parentId'],
    },
  ],
});

// Class methods
Comment.associate = (models) => {
  Comment.belongsTo(models.Submission, {
    foreignKey: 'submissionId',
    as: 'submission',
  });
  
  Comment.belongsTo(models.Announcement, {
    foreignKey: 'announcementId',
    as: 'announcement',
  });
  
  Comment.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  // Self-referential relationship for replies
  Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent',
  });
  
  Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies',
  });
  
  Comment.hasMany(models.CommentReaction, {
    foreignKey: 'commentId',
    as: 'reactions',
  });
};

// Hooks
Comment.afterCreate(async (comment) => {
  // Update comment count on the parent resource
  if (comment.submissionId) {
    await comment.sequelize.models.Submission.increment('commentCount', {
      where: { id: comment.submissionId },
    });
  } else if (comment.announcementId) {
    await comment.sequelize.models.Announcement.increment('commentCount', {
      where: { id: comment.announcementId },
    });
  }
  
  // Notify relevant users about the new comment
  await comment.notifyUsers();
});

Comment.beforeDestroy(async (comment) => {
  // Decrement comment count on the parent resource
  if (comment.submissionId) {
    await comment.sequelize.models.Submission.decrement('commentCount', {
      where: { id: comment.submissionId },
    });
  } else if (comment.announcementId) {
    await comment.sequelize.models.Announcement.decrement('commentCount', {
      where: { id: comment.announcementId },
    });
  }
});

// Instance methods
Comment.prototype.addReaction = async function(userId, reactionType) {
  const [reaction] = await this.sequelize.models.CommentReaction.findOrCreate({
    where: {
      commentId: this.id,
      userId,
    },
    defaults: {
      type: reactionType,
    },
  });
  
  // If reaction already exists and is different, update it
  if (reaction.type !== reactionType) {
    reaction.type = reactionType;
    await reaction.save();
  }
  
  return reaction;
};

Comment.prototype.removeReaction = async function(userId) {
  return this.sequelize.models.CommentReaction.destroy({
    where: {
      commentId: this.id,
      userId,
    },
  });
};

Comment.prototype.notifyUsers = async function() {
  try {
    const { User, Notification } = this.sequelize.models;
    let recipients = [];
    
    // Get the parent resource (submission or announcement)
    const parent = await (this.submissionId 
      ? this.getSubmission({ include: [{ model: User, as: 'submittedBy' }] })
      : this.getAnnouncement({ include: [{ model: User, as: 'createdBy' }] }));
    
    // If this is a reply, notify the parent comment's author
    if (this.parentId) {
      const parentComment = await this.getParent({
        include: [{ model: User, as: 'user' }],
      });
      
      if (parentComment && parentComment.userId !== this.userId) {
        recipients.push(parentComment.userId);
      }
    }
    
    // Notify the parent resource author if it's not the current user
    const parentAuthor = this.submissionId 
      ? parent.submittedBy.id 
      : parent.createdBy.id;
    
    if (parentAuthor !== this.userId) {
      recipients.push(parentAuthor);
    }
    
    // Remove duplicates
    recipients = [...new Set(recipients)];
    
    // Create notifications
    if (recipients.length > 0) {
      await Notification.bulkCreate(
        recipients.map(userId => ({
          userId,
          type: 'new_comment',
          referenceId: this.id,
          referenceType: this.submissionId ? 'submission' : 'announcement',
          message: this.submissionId 
            ? 'New comment on your submission' 
            : 'New comment on announcement',
          metadata: {
            commentId: this.id,
            authorId: this.userId,
            content: this.content.substring(0, 100) + (this.content.length > 100 ? '...' : ''),
          },
        }))
      );
      
      // TODO: Send real-time notifications via WebSocket
    }
  } catch (error) {
    console.error('Error notifying users about comment:', error);
  }
};

// Class methods for queries
Comment.findBySubmission = function(submissionId, options = {}) {
  return this.findAll({
    where: { submissionId, parentId: null },
    include: [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: this.sequelize.models.CommentReaction,
        as: 'reactions',
        attributes: ['type', 'userId'],
      },
      {
        model: this,
        as: 'replies',
        include: [
          {
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
          {
            model: this.sequelize.models.CommentReaction,
            as: 'reactions',
            attributes: ['type', 'userId'],
          },
        ],
      },
    ],
    order: [
      ['createdAt', 'ASC'],
      [{ model: this, as: 'replies' }, 'createdAt', 'ASC'],
    ],
    ...options,
  });
};

Comment.findByAnnouncement = function(announcementId, options = {}) {
  return this.findAll({
    where: { announcementId, parentId: null },
    include: [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: this.sequelize.models.CommentReaction,
        as: 'reactions',
        attributes: ['type', 'userId'],
      },
      {
        model: this,
        as: 'replies',
        include: [
          {
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
          {
            model: this.sequelize.models.CommentReaction,
            as: 'reactions',
            attributes: ['type', 'userId'],
          },
        ],
      },
    ],
    order: [
      ['createdAt', 'ASC'],
      [{ model: this, as: 'replies' }, 'createdAt', 'ASC'],
    ],
    ...options,
  });
};

export { Comment };
