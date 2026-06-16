const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userUid: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true // e.g. "React Developer", "Coding Test (DSA)"
  },
  feedback: {
    type: String,
    default: ''
  },
  details: {
    type: Array,
    default: [] // Array of question-answer-score pairs
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);
