const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['approve_user', 'reject_user', 'suspend_user', 'reactivate_user', 'resolve_report', 'dismiss_report', 'update_credibility'],
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Pour stocker des données supplémentaires
    default: {}
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les recherches
adminActionSchema.index({ admin: 1, createdAt: -1 });
adminActionSchema.index({ action: 1, createdAt: -1 });
adminActionSchema.index({ targetUser: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAction', adminActionSchema);