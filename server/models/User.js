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
  college: {
    type: String,
    default: '',
    index: true
  },
  branch: {
    type: String,
    default: '',
    index: true
  },
  batch: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  totalScore: {
    type: Number,
    default: 0,
    index: true
  },
  weeklyScore: {
    type: Number,
    default: 0,
    index: true
  },
  monthlyScore: {
    type: Number,
    default: 0,
    index: true
  },
  streak: {
    type: Number,
    default: 0,
    index: true
  },
  problemsSolved: {
    type: Number,
    default: 0,
    index: true
  },
  contestRating: {
    type: Number,
    default: 0,
    index: true
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true
  },
  codingProfiles: {
    github: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    codechef: { type: String, default: '' },
    gfg: { type: String, default: '' }
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
      score: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    },
    leetcode: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      contestRating: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    },
    codeforces: {
      currentRating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      rank: { type: String, default: 'unrated' },
      contestsParticipated: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      ratingHistory: [{ contestName: String, rating: Number, date: String }],
      score: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    },
    codechef: {
      rating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      globalRank: { type: Number, default: 0 },
      stars: { type: String, default: '1★' },
      problemsSolved: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    },
    gfg: {
      score: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      globalRank: { type: Number, default: 0 },
      lastSyncedAt: { type: Date }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound/extra indexes for robust leaderboard sorting
UserSchema.index({ weeklyScore: -1 });
UserSchema.index({ monthlyScore: -1 });
UserSchema.index({ problemsSolved: -1 });
UserSchema.index({ streak: -1 });

// Real-time hooks to broadcast updates via event emitter
const { leaderboardEmitter } = require('../utils/leaderboardEvents');

const broadcastUpdate = () => {
  leaderboardEmitter.emit('update');
};

UserSchema.post('save', broadcastUpdate);
UserSchema.post('findOneAndUpdate', broadcastUpdate);
UserSchema.post('updateMany', broadcastUpdate);
UserSchema.post('deleteMany', broadcastUpdate);

module.exports = mongoose.model('User', UserSchema);
