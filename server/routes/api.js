const express = require('express');
const router = express.Router();

// Import upload middleware
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/auth');

// Import controllers
const resumeController = require('../controllers/resumeController');
const interviewController = require('../controllers/interviewController');
const codeController = require('../controllers/codeController');
const profileController = require('../controllers/profileController');
const codingProfileController = require('../controllers/codingProfileController');
const leaderboardController = require('../controllers/leaderboardController');

// Apply auth middleware to protect all routes
router.use(verifyToken);

// 1. Upload and parse resume
router.post('/upload', upload.single('resume'), resumeController.uploadResume);

// 2. Generate Questions based on resume and role
router.post('/generate-questions', interviewController.generateQuestions);

// 3. Evaluate subjective and MCQ answers
router.post('/evaluate', interviewController.evaluateAnswers);

// 4. Evaluate DSA coding submissions
router.post('/evaluate-coding', codeController.evaluateCoding);

// 5. Simulate compiling and executing test cases
router.post('/run-code', codeController.runCode);

// 6. User profile endpoints
router.get('/profile', profileController.getProfile);
router.post('/profile', profileController.saveProfile);

// 7. Coding profile endpoints
router.post('/profile/coding-profiles', codingProfileController.saveCodingProfiles);
router.post('/profile/sync-coding-profiles', codingProfileController.syncCodingProfiles);
router.get('/profile/coding-stats', codingProfileController.getCodingStats);

// 8. Leaderboard endpoints
router.get('/leaderboard/realtime', leaderboardController.getRealtimeUpdates);
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/top-three', leaderboardController.getTopThree);
router.get('/leaderboard/stats', leaderboardController.getLeaderboardStats);

module.exports = router;
