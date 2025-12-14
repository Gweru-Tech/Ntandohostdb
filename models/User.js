const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise', 'admin'],
    default: 'free'
  },
  sites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  apiKeys: [{
    key: String,
    name: String,
    createdAt: { type: Date, default: Date.now }
  }],
  settings: {
    notifications: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true }
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canViewAllSites: { type: Boolean, default: false },
    canDeleteUsers: { type: Boolean, default: false },
    canModifyPlans: { type: Boolean, default: false },
    unlimitedSites: { type: Boolean, default: false },
    unlimitedStorage: { type: Boolean, default: false }
  },
  stats: {
    totalSites: { type: Number, default: 0 },
    totalStorage: { type: Number, default: 0 },
    totalBandwidth: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate API key method
userSchema.methods.generateApiKey = function(name) {
  const apiKey = require('crypto').randomBytes(32).toString('hex');
  this.apiKeys.push({ key: apiKey, name });
  return this.save();
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Get user limits based on plan and role
userSchema.methods.getLimits = function() {
  if (this.role === 'admin') {
    return {
      maxSites: Infinity,
      maxStorage: Infinity,
      maxFileUpload: 100 * 1024 * 1024, // 100MB
      maxFilesPerUpload: 50
    };
  }

  const limits = {
    free: { maxSites: 1, maxStorage: 100 * 1024 * 1024, maxFileUpload: 10 * 1024 * 1024, maxFilesPerUpload: 5 }, // 100MB, 10MB per file
    pro: { maxSites: 10, maxStorage: 10 * 1024 * 1024 * 1024, maxFileUpload: 50 * 1024 * 1024, maxFilesPerUpload: 10 }, // 10GB, 50MB per file
    enterprise: { maxSites: 100, maxStorage: 100 * 1024 * 1024 * 1024, maxFileUpload: 100 * 1024 * 1024, maxFilesPerUpload: 20 } // 100GB, 100MB per file
  };

  return limits[this.plan] || limits.free;
};

// Set admin permissions
userSchema.methods.makeAdmin = function() {
  this.role = 'admin';
  this.plan = 'admin';
  this.permissions = {
    canManageUsers: true,
    canViewAllSites: true,
    canDeleteUsers: true,
    canModifyPlans: true,
    unlimitedSites: true,
    unlimitedStorage: true
  };
  return this.save();
};

// Create admin user static method
userSchema.statics.createAdmin = async function(username, email, password) {
  const existingAdmin = await this.findOne({ role: 'admin' });
  if (existingAdmin) {
    throw new Error('Admin user already exists');
  }

  const admin = new this({
    username,
    email,
    password,
    role: 'admin',
    plan: 'admin',
    permissions: {
      canManageUsers: true,
      canViewAllSites: true,
      canDeleteUsers: true,
      canModifyPlans: true,
      unlimitedSites: true,
      unlimitedStorage: true
    }
  });

  return admin.save();
};

module.exports = mongoose.model('User', userSchema);