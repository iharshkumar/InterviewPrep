const Interview = require('../../backend/models/Interview');
const User = require('../../backend/models/User');

// Get all interviews or filter by userUid
const getInterviews = async (req, res) => {
  try {
    const { userUid } = req.query;
    const filter = userUid ? { userUid } : {};
    
    // Sort interviews with newest first
    const interviews = await Interview.find(filter).sort({ date: -1 });
    
    // Enrich with user names
    const enrichedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        const user = await User.findOne({ firebaseUid: interview.userUid }).select('name email');
        return {
          ...interview.toObject(),
          userName: user ? user.name : 'Unknown User',
          userEmail: user ? user.email : 'N/A'
        };
      })
    );
    
    return res.json(enrichedInterviews);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch interviews: ' + error.message });
  }
};

// Get single interview by ID
const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const user = await User.findOne({ firebaseUid: interview.userUid }).select('name email');
    return res.json({
      ...interview.toObject(),
      userName: user ? user.name : 'Unknown User',
      userEmail: user ? user.email : 'N/A'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch interview: ' + error.message });
  }
};

// Delete single interview by ID
const deleteInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findByIdAndDelete(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    return res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete interview: ' + error.message });
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  deleteInterviewById
};
