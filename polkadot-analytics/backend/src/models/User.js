const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 100]
      }
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      field: 'email_verification_token'
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      field: 'email_verification_expires'
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      field: 'password_reset_expires'
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'login_attempts'
    },
    lockUntil: {
      type: DataTypes.DATE,
      field: 'lock_until'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login'
    },
    apiKey: {
      type: DataTypes.STRING,
      field: 'api_key'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    watchlist: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.generateAuthToken = function() {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  };

  User.prototype.generateEmailVerificationToken = function() {
    const token = jwt.sign(
      { id: this.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return token;
  };

  User.prototype.generatePasswordResetToken = function() {
    const token = jwt.sign(
      { id: this.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 3600000);
    return token;
  };

  User.prototype.generateApiKey = function() {
    const apiKey = jwt.sign(
      { id: this.id, email: this.email },
      process.env.API_KEY_SECRET || 'your-api-key-secret',
      { expiresIn: '365d' }
    );
    this.apiKey = apiKey;
    return apiKey;
  };

  User.prototype.isLocked = function() {
    return this.lockUntil && this.lockUntil > new Date();
  };

  User.prototype.incLoginAttempts = async function() {
    const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
    const MAX_LOGIN_ATTEMPTS = 5;

    if (this.lockUntil && this.lockUntil < new Date()) {
      return await this.update({
        loginAttempts: 1,
        lockUntil: null
      });
    }

    const updates = { loginAttempts: this.loginAttempts + 1 };

    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
      updates.lockUntil = new Date(Date.now() + LOCK_TIME);
    }

    return await this.update(updates);
  };

  User.prototype.resetLoginAttempts = async function() {
    return await this.update({
      loginAttempts: 0,
      lockUntil: null
    });
  };

  User.prototype.addToWatchlist = async function(parachainId) {
    const watchlist = this.watchlist || [];
    if (!watchlist.includes(parachainId)) {
      watchlist.push(parachainId);
      return await this.update({ watchlist });
    }
    return this;
  };

  User.prototype.removeFromWatchlist = async function(parachainId) {
    const watchlist = (this.watchlist || []).filter(id => id !== parachainId);
    return await this.update({ watchlist });
  };

  // Static methods
  User.findByCredentials = async function(email, password) {
    const user = await this.findOne({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid login credentials');
    }

    if (user.isLocked()) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      throw new Error('Invalid login credentials');
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();
    
    return user;
  };

  User.findByEmailVerificationToken = async function(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return await this.findOne({
        where: {
          id: decoded.id,
          emailVerificationToken: token,
          emailVerificationExpires: { [sequelize.Op.gt]: new Date() }
        }
      });
    } catch (error) {
      return null;
    }
  };

  User.findByPasswordResetToken = async function(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return await this.findOne({
        where: {
          id: decoded.id,
          passwordResetToken: token,
          passwordResetExpires: { [sequelize.Op.gt]: new Date() }
        }
      });
    } catch (error) {
      return null;
    }
  };

  return User;
};
