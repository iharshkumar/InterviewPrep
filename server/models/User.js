const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'Software Engineer'
  },
  experience: {
    type: String,
    default: 'mid'
  },
  github: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  resumeFilename: {
    type: String,
    default: ''
  },
  resumeText: {
    type: String,
    default: ''
  },
  codingProfiles: {
    github: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' }
  },
  codingStats: {
    github: {
      repositories: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      contributions: { type: Number, default: 0 },
      topLanguages: [{ name: String, count: Number }],
      latestRepos: [{ name: String, url: String, description: String, stars: Number, language: String }],
      lastSyncedAt: { type: Date }
    },
    leetcode: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      contestRating: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    },
    codeforces: {
      currentRating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      rank: { type: String, default: 'unrated' },
      contestsParticipated: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      ratingHistory: [{ contestName: String, rating: Number, date: String }],
      lastSyncedAt: { type: Date }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
