const User = require('../../backend/models/User');
const Interview = require('../../backend/models/Interview');

const getStats = async (req, res) => {
  try {
    // 1. Total counts
    const totalUsers = await User.countDocuments();
    const totalInterviews = await Interview.countDocuments();

    // 2. Average interview score
    const avgScoreResult = await Interview.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" }
        }
      }
    ]);
    const avgScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore * 10) / 10 : 0;

    // 3. Total coding problems solved
    const totalSolvedResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalSolved: { $sum: "$problemsSolved" }
        }
      }
    ]);
    const totalProblemsSolved = totalSolvedResult.length > 0 ? totalSolvedResult[0].totalSolved : 0;

    // 4. Branch distribution
    const branchDistribution = await User.aggregate([
      {
        $group: {
          _id: "$branch",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: { $cond: [{ $eq: ["$_id", ""] }, "Unspecified", "$_id"] },
          value: "$count",
          _id: 0
        }
      },
      { $sort: { value: -1 } }
    ]);

    // 5. Experience distribution
    const experienceDistribution = await User.aggregate([
      {
        $group: {
          _id: "$experience",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", "entry"] }, then: "Entry Level" },
                { case: { $eq: ["$_id", "mid"] }, then: "Mid Level" },
                { case: { $eq: ["$_id", "senior"] }, then: "Senior Level" }
              ],
              default: "Unspecified"
            }
          },
          value: "$count",
          _id: 0
        }
      },
      { $sort: { value: -1 } }
    ]);

    // 6. Top 5 performers
    const topPerformers = await User.find()
      .sort({ totalScore: -1 })
      .limit(5)
      .select('name email college branch totalScore streak');

    return res.json({
      totalUsers,
      totalInterviews,
      avgScore,
      totalProblemsSolved,
      branchDistribution,
      experienceDistribution,
      topPerformers
    });
  } catch (error) {
    console.error('Admin Backend: Stats aggregation failed:', error);
    return res.status(500).json({ error: 'Failed to aggregate statistics: ' + error.message });
  }
};

module.exports = {
  getStats
};
