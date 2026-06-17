const User = require('../models/User');
const { leaderboardEmitter } = require('../utils/leaderboardEvents');

// Helper to construct filter query based on parameters
const buildFilterQuery = (query) => {
  const filter = {};

  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { college: searchRegex }
    ];
  }

  if (query.college) {
    filter.college = query.college.trim();
  }

  if (query.branch) {
    filter.branch = query.branch.trim();
  }

  if (query.batch) {
    filter.batch = query.batch.trim();
  }

  if (query.year) {
    filter.year = query.year.trim();
  }

  if (query.platform && query.platform.toLowerCase() !== 'all') {
    const platform = query.platform.toLowerCase();
    // Maps readable platform query strings to the correct nested profile field name
    let field = '';
    if (platform === 'github') field = 'codingProfiles.github';
    else if (platform === 'leetcode') field = 'codingProfiles.leetcode';
    else if (platform === 'codeforces') field = 'codingProfiles.codeforces';
    else if (platform === 'codechef') field = 'codingProfiles.codechef';
    else if (platform === 'gfg' || platform === 'geeksforgeeks') field = 'codingProfiles.gfg';

    if (field) {
      filter[field] = { $ne: '' };
    }
  }

  return filter;
};

// Helper to resolve MongoDB sorting field based on criteria
const getSortField = (sortBy, timeframe) => {
  if (timeframe === 'week') return 'weeklyScore';
  if (timeframe === 'month') return 'monthlyScore';

  switch (sortBy) {
    case 'problemsSolved': return 'problemsSolved';
    case 'contestRating': return 'contestRating';
    case 'streak': return 'streak';
    case 'weeklyScore': return 'weeklyScore';
    case 'totalScore':
    default:
      return 'totalScore';
  }
};

/**
 * GET /api/leaderboard
 */
const getLeaderboard = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);
    const timeframe = req.query.timeframe || 'allTime';
    const sortBy = req.query.sortBy || 'totalScore';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortField = getSortField(sortBy, timeframe);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const sortOption = { [sortField]: sortOrder };
    
    // Fetch users list and total count matching query
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('-resumeText'), // exclude resumeText for lighter weight payloads
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard data' });
  }
};

/**
 * GET /api/leaderboard/top-three
 */
const getTopThree = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);
    const timeframe = req.query.timeframe || 'allTime';
    const sortBy = req.query.sortBy || 'totalScore';
    const sortField = getSortField(sortBy, timeframe);

    const users = await User.find(filter)
      .sort({ [sortField]: -1 }) // Top 3 is always high-to-low
      .limit(3)
      .select('-resumeText');

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching top three:', error);
    res.status(500).json({ error: 'Failed to retrieve top three users' });
  }
};

/**
 * GET /api/leaderboard/stats
 */
const getLeaderboardStats = async (req, res) => {
  try {
    const filter = buildFilterQuery(req.query);

    // Fetch unique options present in database to populate filters
    const [colleges, branches, batches, years, totalUsers] = await Promise.all([
      User.distinct('college', { college: { $ne: '' } }),
      User.distinct('branch', { branch: { $ne: '' } }),
      User.distinct('batch', { batch: { $ne: '' } }),
      User.distinct('year', { year: { $ne: '' } }),
      User.countDocuments(filter)
    ]);

    // Find latest activity timestamp
    const latestUser = await User.findOne({}).sort({ lastActive: -1 }).select('lastActive');
    const lastUpdated = latestUser ? latestUser.lastActive : new Date();

    res.json({
      success: true,
      stats: {
        totalUsers,
        lastUpdated,
        colleges,
        branches,
        batches,
        years
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard metadata' });
  }
};

/**
 * GET /api/leaderboard/realtime (SSE Stream)
 */
const getRealtimeUpdates = async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Flush initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

    const onUpdate = () => {
      res.write(`data: ${JSON.stringify({ type: 'update', timestamp: new Date() })}\n\n`);
    };

    leaderboardEmitter.on('update', onUpdate);

    req.on('close', () => {
      leaderboardEmitter.off('update', onUpdate);
    });
  } catch (error) {
    console.error('SSE initialization error:', error);
    res.status(500).end();
  }
};

module.exports = {
  getLeaderboard,
  getTopThree,
  getLeaderboardStats,
  getRealtimeUpdates
};
