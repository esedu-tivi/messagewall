const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 60 // Duration in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  voters: [{
    userId: String,
    optionIndex: Number
  }],
  deletionTimer: {
    type: Number,
    default: 20, // Default 20 seconds
    min: 5,      // Minimum 5 seconds
    max: 300     // Maximum 5 minutes
  },
  endedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Poll', PollSchema);