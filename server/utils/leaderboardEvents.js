const EventEmitter = require('events');

class LeaderboardEmitter extends EventEmitter {}

const leaderboardEmitter = new LeaderboardEmitter();

// Maximize listeners to prevent memory warnings in development environments
leaderboardEmitter.setMaxListeners(100);

module.exports = {
  leaderboardEmitter
};
