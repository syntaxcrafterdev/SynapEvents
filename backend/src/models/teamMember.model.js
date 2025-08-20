import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member',
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'left'),
    defaultValue: 'pending',
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  leftAt: {
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
      fields: ['teamId', 'userId'],
      unique: true,
    },
    {
      fields: ['status'],
    },
  ],
});

// Class methods
TeamMember.associate = (models) => {
  TeamMember.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team',
  });
  
  TeamMember.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  TeamMember.belongsTo(models.User, {
    foreignKey: 'invitedById',
    as: 'invitedBy',
  });
};

// Hooks
TeamMember.beforeCreate(async (teamMember) => {
  // Set joinedAt when status is set to 'accepted' for the first time
  if (teamMember.status === 'accepted' && !teamMember.joinedAt) {
    teamMember.joinedAt = new Date();
  }
});

TeamMember.beforeUpdate(async (teamMember) => {
  // Set leftAt when status is set to 'left' or 'rejected'
  if (
    (teamMember.status === 'left' || teamMember.status === 'rejected') &&
    !teamMember.leftAt
  ) {
    teamMember.leftAt = new Date();
  }
  
  // Set joinedAt when status changes to 'accepted'
  if (
    teamMember.status === 'accepted' &&
    teamMember._previousDataValues.status !== 'accepted' &&
    !teamMember.joinedAt
  ) {
    teamMember.joinedAt = new Date();
  }
});

// Instance methods
TeamMember.prototype.acceptInvitation = async function() {
  if (this.status !== 'pending') {
    throw new Error('Invitation is not pending');
  }
  
  // Check if team is full
  const team = await this.getTeam({
    include: [{
      model: TeamMember,
      as: 'members',
      where: { status: 'accepted' },
      required: false,
    }],
  });
  
  if (team.members.length >= team.event.maxTeamSize) {
    throw new Error('Team is already full');
  }
  
  // Check if user is already in another team for this event
  const existingTeam = await TeamMember.findOne({
    where: {
      userId: this.userId,
      status: 'accepted',
    },
    include: [{
      model: Team,
      where: { eventId: team.eventId },
    }],
  });
  
  if (existingTeam) {
    throw new Error('You are already in another team for this event');
  }
  
  this.status = 'accepted';
  this.joinedAt = new Date();
  return this.save();
};

TeamMember.prototype.leaveTeam = async function() {
  if (this.status !== 'accepted') {
    throw new Error('You are not an active member of this team');
  }
  
  // If this is the team leader, transfer ownership or disband the team
  const team = await this.getTeam();
  if (team.leaderId === this.userId) {
    // Find another admin to transfer ownership to
    const newLeader = await TeamMember.findOne({
      where: {
        teamId: this.teamId,
        userId: { [Op.ne]: this.userId }, // Not the current user
        role: 'admin',
        status: 'accepted',
      },
    });
    
    if (newLeader) {
      // Transfer ownership to another admin
      await team.update({ leaderId: newLeader.userId });
    } else {
      // No other admins, delete the team if it has no submissions
      const submissionCount = await team.countSubmissions();
      if (submissionCount > 0) {
        throw new Error('Cannot leave team with submissions. Please transfer ownership first.');
      }
      
      // Delete the team
      await team.destroy();
      return { message: 'Team has been disbanded as you were the only member' };
    }
  }
  
  // Update status to left
  this.status = 'left';
  this.leftAt = new Date();
  await this.save();
  
  return { message: 'You have left the team' };
};

export { TeamMember };
