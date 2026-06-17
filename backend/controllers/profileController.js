const User = require('../models/User');
const Interview = require('../models/Interview');

/**
 * Fetch the user profile from MongoDB and compute statistics dynamically from past interview records
 */
const getProfile = async (req, res) => {
  const loggedInUid = req.user.uid;
  const firebaseUid = req.query.uid || loggedInUid;
  const isOwnProfile = firebaseUid === loggedInUid;

  try {
    // 1. Find or create the user profile
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      if (isOwnProfile) {
        const userEmail = req.user.email || 'user@example.com';
        const userName = req.user.name || 'AI Candidate';
        user = new User({
          firebaseUid,
          name: userName,
          email: userEmail,
          role: 'Software Engineer',
          experience: 'mid'
        });
        await user.save();
      } else {
        return res.status(404).json({ error: 'User profile not found' });
      }
    } else if (isOwnProfile) {
      // Sync name or email if they are empty/default and we have better data from login
      let updated = false;
      const userName = req.user.name || 'AI Candidate';
      const userEmail = req.user.email || 'user@example.com';
      if ((user.name === 'AI Candidate' || !user.name) && userName !== 'AI Candidate') {
        user.name = userName;
        updated = true;
      }
      if ((user.email === 'user@example.com' || !user.email) && userEmail !== 'user@example.com') {
        user.email = userEmail;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // 2. Fetch all completed interviews to compile statistics
    const history = await Interview.find({ userUid: firebaseUid }).sort({ date: -1 });

    // 3. Compute stats dynamically
    const interviewsCompleted = history.length;
    
    const calculatedScore = history.reduce((sum, item) => sum + item.score, 0);
    const avgScore = interviewsCompleted > 0 ? Math.round(calculatedScore / interviewsCompleted) : 0;

    // Calculate coding specific progress
    const codingInterviews = history.filter(item => item.type.includes('Coding') || item.type.includes('DSA'));
    const codingProgress = codingInterviews.length > 0 
      ? Math.round(codingInterviews.reduce((sum, item) => sum + item.score, 0) / codingInterviews.length) 
      : 0;

    // Formulate final response containing details, stats, and chronological history logs
    const responseData = {
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      role: user.role,
      experience: user.experience,
      github: user.github,
      linkedin: user.linkedin,
      college: user.college || '',
      branch: user.branch || '',
      batch: user.batch || '',
      year: user.year || '',
      totalScore: user.totalScore || 0,
      streak: user.streak || 0,
      lastActive: user.lastActive || user.createdAt,
      isOwnProfile,
      resumeFilename: user.resumeFilename || 'No resume uploaded',
      resumeText: user.resumeText || 'Upload a PDF resume in the dashboard to initialize neural parsing...',
      stats: {
        interviewsCompleted,
        avgScore,
        technicalAbility: interviewsCompleted > 0 ? +(avgScore / 10).toFixed(1) : 0,
        communicationDepth: interviewsCompleted > 0 ? +((avgScore * 0.95) / 10).toFixed(1) : 0,
        codingProgress: codingProgress || 0
      },
      history: history.map(item => {
        const firstDetail = item.details && item.details[0];
        return {
          id: item._id,
          role: item.role,
          date: item.date.toISOString().split('T')[0],
          score: item.score,
          type: item.type,
          userCode: firstDetail?.userCode || null,
          language: firstDetail?.language || null
        };
      })
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching MongoDB profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile data' });
  }
};

/**
 * Update user profile details in MongoDB
 */
const saveProfile = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          role: req.body.role,
          experience: req.body.experience,
          github: req.body.github,
          linkedin: req.body.linkedin,
          college: req.body.college,
          branch: req.body.branch,
          batch: req.body.batch,
          year: req.body.year,
          lastActive: new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Return the updated fields immediately
    res.json({ success: true, profile: user });
  } catch (error) {
    console.error('Error saving profile in MongoDB:', error);
    res.status(500).json({ error: 'Failed to persist profile updates' });
  }
};

module.exports = {
  getProfile,
  saveProfile
};
