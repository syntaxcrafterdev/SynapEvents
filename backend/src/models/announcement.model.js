import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Announcement = sequelize.define('Announcement', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
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
      fields: ['eventId'],
    },
    {
      fields: ['isPinned'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

// Class methods
Announcement.associate = (models) => {
  Announcement.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
  
  Announcement.belongsTo(models.User, {
    foreignKey: 'createdById',
    as: 'createdBy',
  });
  
  Announcement.hasMany(models.AnnouncementRecipient, {
    foreignKey: 'announcementId',
    as: 'recipients',
  });
  
  Announcement.hasMany(models.Comment, {
    foreignKey: 'announcementId',
    as: 'comments',
  });
};

// Hooks
Announcement.afterCreate(async (announcement, options) => {
  // If this is a public announcement, create recipient records for all event participants
  if (announcement.isPublic && announcement.eventId) {
    const { EventParticipant } = announcement.sequelize.models;
    
    // Get all participants for the event
    const participants = await EventParticipant.findAll({
      where: { eventId: announcement.eventId },
      attributes: ['userId'],
      raw: true,
    });
    
    if (participants.length > 0) {
      // Create recipient records
      await announcement.sequelize.models.AnnouncementRecipient.bulkCreate(
        participants.map(participant => ({
          announcementId: announcement.id,
          userId: participant.userId,
          status: 'unread',
        })),
        { transaction: options.transaction }
      );
    }
  }
});

// Instance methods
Announcement.prototype.addRecipients = async function(userIds, options = {}) {
  const recipients = userIds.map(userId => ({
    announcementId: this.id,
    userId,
    status: 'unread',
  }));
  
  return this.sequelize.models.AnnouncementRecipient.bulkCreate(
    recipients,
    { ...options, updateOnDuplicate: ['status', 'updatedAt'] }
  );
};

Announcement.prototype.markAsRead = async function(userId) {
  const recipient = await this.sequelize.models.AnnouncementRecipient.findOne({
    where: {
      announcementId: this.id,
      userId,
    },
  });
  
  if (recipient && recipient.status === 'unread') {
    recipient.status = 'read';
    await recipient.save();
  }
  
  return recipient;
};

// Class methods for queries
Announcement.findByEvent = function(eventId, userId = null, options = {}) {
  const include = [
    {
      model: this.sequelize.models.User,
      as: 'createdBy',
      attributes: ['id', 'name', 'email', 'avatar'],
    },
  ];
  
  // If user ID is provided, include read status
  if (userId) {
    include.push({
      model: this.sequelize.models.AnnouncementRecipient,
      as: 'recipients',
      where: { userId },
      required: false,
      attributes: ['status', 'readAt'],
    });
  }
  
  return this.findAll({
    where: { eventId },
    include,
    order: [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    ...options,
  });
};

Announcement.getUnreadCount = function(userId, eventId = null) {
  const where = {
    userId,
    status: 'unread',
  };
  
  if (eventId) {
    where['$announcement.eventId$'] = eventId;
  }
  
  return this.sequelize.models.AnnouncementRecipient.count({
    where,
    include: [
      {
        model: this,
        as: 'announcement',
        attributes: [],
        required: true,
      },
    ],
  });
};

export { Announcement };
