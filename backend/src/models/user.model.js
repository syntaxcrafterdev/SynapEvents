import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for OAuth users
    private: true,
  },
  role: {
    type: DataTypes.ENUM('participant', 'organizer', 'judge', 'admin'),
    defaultValue: 'participant',
  },
  avatar: {
    type: DataTypes.STRING,
  },
  bio: {
    type: DataTypes.TEXT,
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  oauthProvider: {
    type: DataTypes.STRING, // 'google', 'github', etc.
  },
  oauthId: {
    type: DataTypes.STRING, // ID from OAuth provider
  },
}, {
  timestamps: true,
  paranoid: true, // Enable soft deletes
  defaultScope: {
    attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'emailVerificationExpires'] },
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] },
    },
  },
});

// Hash password before saving
User.beforeSave(async (user) => {
  if (user.changed('password') && user.password) {
    user.password = await bcrypt.hash(user.password, 12);
    user.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password change
  }
});

// Instance methods
User.prototype.isPasswordCorrect = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

User.prototype.createPasswordResetToken = function() {
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

User.prototype.createEmailVerificationToken = function() {
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

User.prototype.generateAuthToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Remove sensitive data
  delete values.password;
  delete values.passwordResetToken;
  delete values.passwordResetExpires;
  delete values.emailVerificationToken;
  delete values.emailVerificationExpires;
  
  return values;
};

export { User };
