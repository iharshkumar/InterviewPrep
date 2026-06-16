const User = require('../models/User');

/**
 * Fetch and scrape GitHub profile details
 */
const fetchGitHubStats = async (username) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch user base info
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 404) throw new Error(`GitHub user ${username} not found`);
      throw new Error(`GitHub API returned status ${userRes.status}`);
    }
    const userData = await userRes.json();

    // 2. Fetch user repositories
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    let repos = [];
    if (reposRes.ok) {
      repos = await reposRes.json();
    }

    // 3. Compute stats
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    
    // Aggregate languages
    const langMap = {};
    repos.forEach(r => {
      if (r.language) {
        langMap[r.language] = (langMap[r.language] || 0) + 1;
      }
    });
    
    const topLanguages = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ name: entry[0], count: entry[1] }))
      .slice(0, 5);

    // Get latest 5 repositories
    const latestRepos = repos
      .filter(r => !r.fork)
      .slice(0, 5)
      .map(r => ({
        name: r.name,
        url: r.html_url,
        description: r.description || '',
        stars: r.stargazers_count || 0,
        language: r.language || 'Unknown'
      }));

    // 4. Scrape contributions from profile HTML page
    let contributions = 0;
    try {
      const contribRes = await fetch(`https://github.com/users/${username}/contributions`, { headers });
      if (contribRes.ok) {
        const text = await contribRes.text();
        const match = text.match(/(\d+[,.]?\d*)\s+contributions/i);
        if (match) {
          contributions = parseInt(match[1].replace(/[,.]/g, ''), 10);
        }
      }
    } catch (err) {
      console.warn(`Failed to scrape GitHub contributions for ${username}:`, err.message);
    }

    return {
      repositories: userData.public_repos || 0,
      followers: userData.followers || 0,
      following: userData.following || 0,
      totalStars,
      contributions,
      topLanguages,
      latestRepos,
      lastSyncedAt: new Date()
    };
  } catch (error) {
    console.error(`Error fetching GitHub stats for ${username}:`, error.message);
    throw error;
  }
};

/**
 * Fetch LeetCode profile statistics (GraphQL with REST fallback)
 */
const fetchLeetCodeStats = async (username) => {
  try {
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
          }
        }
        userContestRanking(username: $username) {
          rating
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com/'
      },
      body: JSON.stringify({ query, variables: { username } })
    });

    if (response.ok) {
      const json = await response.json();
      if (json.data && json.data.matchedUser) {
        const stats = json.data.matchedUser.submitStatsGlobal.acSubmissionNum;
        const ranking = json.data.matchedUser.profile.ranking;
        const rating = json.data.userContestRanking ? Math.round(json.data.userContestRanking.rating) : 0;
        return {
          totalSolved: stats.find(s => s.difficulty === 'All')?.count || 0,
          easySolved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
          mediumSolved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
          hardSolved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
          contestRating: rating,
          ranking: ranking || 0,
          lastSyncedAt: new Date()
        };
      }
    }
    throw new Error('LeetCode GraphQL returned bad status or empty data');
  } catch (graphqlError) {
    console.warn(`LeetCode GraphQL failed for ${username}, trying Heroku stats API fallback:`, graphqlError.message);
    
    // Try reliable herokuapp fallback API
    try {
      const fallbackRes = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
      if (!fallbackRes.ok) {
        if (fallbackRes.status === 404) throw new Error(`LeetCode user ${username} not found`);
        throw new Error(`LeetCode fallback API returned status ${fallbackRes.status}`);
      }
      const data = await fallbackRes.json();
      if (data.status === 'success') {
        return {
          totalSolved: data.totalSolved || 0,
          easySolved: data.easySolved || 0,
          mediumSolved: data.mediumSolved || 0,
          hardSolved: data.hardSolved || 0,
          contestRating: 0,
          ranking: data.ranking || 0,
          lastSyncedAt: new Date()
        };
      }
      throw new Error(data.message || 'LeetCode fallback API failed');
    } catch (fallbackError) {
      console.error(`LeetCode fallback API failed for ${username}:`, fallbackError.message);
      throw fallbackError;
    }
  }
};

/**
 * Fetch Codeforces profile statistics
 */
const fetchCodeforcesStats = async (username) => {
  try {
    // 1. Fetch user base info
    const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    if (!infoRes.ok) {
      if (infoRes.status === 400 || infoRes.status === 404) {
        throw new Error(`Codeforces handle ${username} not found`);
      }
      throw new Error(`Codeforces API returned status ${infoRes.status}`);
    }
    const infoData = await infoRes.json();
    if (!infoData || infoData.status !== 'OK') {
      throw new Error('Codeforces user info query failed');
    }
    const user = infoData.result[0];

    // 2. Fetch rating history (for line chart & contests count)
    let ratingHistory = [];
    try {
      const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`);
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        if (ratingData.status === 'OK') {
          ratingHistory = (ratingData.result || []).map(r => ({
            contestName: r.contestName,
            rating: r.newRating,
            date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0]
          }));
        }
      }
    } catch (err) {
      console.warn(`Failed to get Codeforces rating history for ${username}:`, err.message);
    }

    // 3. Fetch submissions status (for unique problems solved)
    let problemsSolved = 0;
    try {
      const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=2000`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === 'OK') {
          const accepted = statusData.result.filter(sub => sub.verdict === 'OK');
          const uniqueProblems = new Set(accepted.map(sub => `${sub.problem.contestId}-${sub.problem.index}`));
          problemsSolved = uniqueProblems.size;
        }
      }
    } catch (err) {
      console.warn(`Failed to get Codeforces submissions for ${username}:`, err.message);
    }

    return {
      currentRating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      contestsParticipated: ratingHistory.length,
      problemsSolved,
      ratingHistory,
      lastSyncedAt: new Date()
    };
  } catch (error) {
    console.error(`Error fetching Codeforces stats for ${username}:`, error.message);
    throw error;
  }
};

/**
 * Sync and fetch details for connected coding profiles
 */
const doSync = async (user, force = false) => {
  const profiles = user.codingProfiles || {};
  let updated = false;

  // GitHub Sync
  if (profiles.github) {
    try {
      const current = user.codingStats?.github?.lastSyncedAt;
      const hoursSinceSync = current ? (new Date() - new Date(current)) / (1000 * 60 * 60) : 25;
      
      if (force || hoursSinceSync >= 24 || !user.codingStats?.github?.lastSyncedAt) {
        const stats = await fetchGitHubStats(profiles.github);
        user.codingStats.github = stats;
        updated = true;
      }
    } catch (err) {
      console.error(`Skipping GitHub sync:`, err.message);
    }
  }

  // LeetCode Sync
  if (profiles.leetcode) {
    try {
      const current = user.codingStats?.leetcode?.lastSyncedAt;
      const hoursSinceSync = current ? (new Date() - new Date(current)) / (1000 * 60 * 60) : 25;
      
      if (force || hoursSinceSync >= 24 || !user.codingStats?.leetcode?.lastSyncedAt) {
        const stats = await fetchLeetCodeStats(profiles.leetcode);
        user.codingStats.leetcode = stats;
        updated = true;
      }
    } catch (err) {
      console.error(`Skipping LeetCode sync:`, err.message);
    }
  }

  // Codeforces Sync
  if (profiles.codeforces) {
    try {
      const current = user.codingStats?.codeforces?.lastSyncedAt;
      const hoursSinceSync = current ? (new Date() - new Date(current)) / (1000 * 60 * 60) : 25;
      
      if (force || hoursSinceSync >= 24 || !user.codingStats?.codeforces?.lastSyncedAt) {
        const stats = await fetchCodeforcesStats(profiles.codeforces);
        user.codingStats.codeforces = stats;
        updated = true;
      }
    } catch (err) {
      console.error(`Skipping Codeforces sync:`, err.message);
    }
  }

  if (updated) {
    await user.save();
  }
  return user;
};

/**
 * POST /api/profile/coding-profiles
 * Save connected usernames and trigger sync
 */
const saveCodingProfiles = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { github, leetcode, codeforces } = req.body;

  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Initialize codingProfiles and codingStats if missing
    if (!user.codingProfiles) user.codingProfiles = {};
    if (!user.codingStats) user.codingStats = {};

    // Check if usernames changed
    const hasGitHubChanged = github !== undefined && github !== user.codingProfiles.github;
    const hasLeetCodeChanged = leetcode !== undefined && leetcode !== user.codingProfiles.leetcode;
    const hasCodeforcesChanged = codeforces !== undefined && codeforces !== user.codingProfiles.codeforces;

    // Save handles
    if (github !== undefined) user.codingProfiles.github = github.trim();
    if (leetcode !== undefined) user.codingProfiles.leetcode = leetcode.trim();
    if (codeforces !== undefined) user.codingProfiles.codeforces = codeforces.trim();

    // Trigger validations & API fetches for updated platforms
    const errors = {};
    
    if (hasGitHubChanged && user.codingProfiles.github) {
      try {
        const stats = await fetchGitHubStats(user.codingProfiles.github);
        user.codingStats.github = stats;
      } catch (err) {
        errors.github = `Invalid GitHub username or API error: ${err.message}`;
      }
    } else if (!user.codingProfiles.github) {
      // Clear stats if username removed
      user.codingStats.github = { repositories: 0, followers: 0, following: 0, totalStars: 0, contributions: 0, topLanguages: [], latestRepos: [] };
    }

    if (hasLeetCodeChanged && user.codingProfiles.leetcode) {
      try {
        const stats = await fetchLeetCodeStats(user.codingProfiles.leetcode);
        user.codingStats.leetcode = stats;
      } catch (err) {
        errors.leetcode = `Invalid LeetCode username or API error: ${err.message}`;
      }
    } else if (!user.codingProfiles.leetcode) {
      user.codingStats.leetcode = { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, contestRating: 0, ranking: 0 };
    }

    if (hasCodeforcesChanged && user.codingProfiles.codeforces) {
      try {
        const stats = await fetchCodeforcesStats(user.codingProfiles.codeforces);
        user.codingStats.codeforces = stats;
      } catch (err) {
        errors.codeforces = `Invalid Codeforces handle or API error: ${err.message}`;
      }
    } else if (!user.codingProfiles.codeforces) {
      user.codingStats.codeforces = { currentRating: 0, maxRating: 0, rank: 'unrated', contestsParticipated: 0, problemsSolved: 0, ratingHistory: [] };
    }

    await user.save();

    if (Object.keys(errors).length > 0) {
      return res.status(207).json({
        success: false,
        message: 'Some coding profiles failed to sync.',
        errors,
        codingProfiles: user.codingProfiles,
        codingStats: user.codingStats
      });
    }

    res.json({
      success: true,
      message: 'Coding profiles updated and synced successfully!',
      codingProfiles: user.codingProfiles,
      codingStats: user.codingStats
    });
  } catch (error) {
    console.error('Error saving coding profiles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /api/profile/sync-coding-profiles
 * Manually force sync of all coding stats
 */
const syncCodingProfiles = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Force sync
    await doSync(user, true);

    res.json({
      success: true,
      message: 'Coding statistics refreshed successfully!',
      codingProfiles: user.codingProfiles,
      codingStats: user.codingStats
    });
  } catch (error) {
    console.error('Error manual syncing coding profiles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * GET /api/profile/coding-stats
 * Get cached profile statistics
 */
const getCodingStats = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Run background sync if needed (triggers only if cached data older than 24 hours)
    // Runs in background so it doesn't block the GET response
    doSync(user, false).catch(err => console.error('Error background sync:', err.message));

    res.json({
      codingProfiles: user.codingProfiles || {},
      codingStats: user.codingStats || {}
    });
  } catch (error) {
    console.error('Error loading coding stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  saveCodingProfiles,
  syncCodingProfiles,
  getCodingStats
};
