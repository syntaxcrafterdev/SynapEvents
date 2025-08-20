import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  inviteCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  inviteExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'disqualified', 'withdrawn'),
    defaultValue: 'active',
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
      fields: ['eventId', 'name'],
      unique: true,
    },
    {
      fields: ['inviteCode'],
      unique: true,
    },
  ],
});

// Class methods
Team.associate = (models) => {
  Team.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event',
  });
  
  Team.belongsTo(models.User, {
    foreignKey: 'leaderId',
    as: 'leader',
  });
  
  Team.hasMany(models.TeamMember, {
    foreignKey: 'teamId',
    as: 'members',
  });
  
  Team.hasMany(models.Submission, {
    foreignKey: 'teamId',
    as: 'submissions',
  });
};

// Hooks
Team.beforeCreate(async (team) => {
  // Generate a unique invite code
  team.inviteCode = await generateUniqueInviteCode();
  // Set invite expiration (7 days from now)
  team.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
});

// Instance methods
Team.prototype.isFull = async function() {
  const count = await this.countMembers();
  return count >= (this.event?.maxTeamSize || 5);
};

Team.prototype.countMembers = async function() {
  return await this.countMembers();
};

Team.prototype.isMember = async function(userId) {
  const count = await this.countMembers({
    where: { userId }
  });
  return count > 0;
};

Team.prototype.isLeader = function(userId) {
  return this.leaderId === userId;
};

Team.prototype.renewInviteCode = async function() {
  this.inviteCode = await generateUniqueInviteCode();
  this.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await this.save();
  return this.inviteCode;
};

// Helper function to generate a unique invite code
async function generateUniqueInviteCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;
  
  while (!isUnique) {
    // Generate a 6-character code
    code = Array(6).fill(0)
      .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
      .join('');
    
    // Check if code is unique
    const existingTeam = await Team.findOne({ where: { inviteCode: code } });
    if (!existingTeam) {
      isUnique = true;
    }
  }
  
  return code;
}

export { Team };
