const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'unknown'],
    default: 'unknown'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Device', deviceSchema);