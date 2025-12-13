const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/
  },
  customDomains: [{
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    verified: { type: Boolean, default: false },
    sslEnabled: { type: Boolean, default: false },
    dnsRecords: {
      A: [String],
      CNAME: [String],
      TXT: [String]
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    custom404: String,
    customError: String,
    passwordProtection: {
      enabled: { type: Boolean, default: false },
      password: String
    },
    analytics: { type: Boolean, default: true },
    indexing: { type: Boolean, default: true }
  },
  stats: {
    visits: { type: Number, default: 0 },
    bandwidth: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    lastDeployed: Date
  },
  active: { type: Boolean, default: true },
  buildStatus: {
    type: String,
    enum: ['pending', 'building', 'success', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

// Index for faster queries
siteSchema.index({ subdomain: 1 });
siteSchema.index({ userId: 1 });
siteSchema.index({ 'customDomains.domain': 1 });

// Method to get site path
siteSchema.methods.getSitePath = function() {
  return require('path').join(process.cwd(), 'hosted-sites', this.userId.toString(), this._id.toString());
};

// Method to update stats
siteSchema.methods.updateStats = function(visitData) {
  this.stats.visits += 1;
  this.stats.bandwidth += visitData.bandwidth || 0;
  this.stats.lastDeployed = new Date();
  return this.save();
};

module.exports = mongoose.model('Site', siteSchema);