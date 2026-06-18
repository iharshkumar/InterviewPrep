const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const interviewController = require('../controllers/interviewController');
const statsController = require('../controllers/statsController');

const verifyAdminToken = require('../middlewares/auth');

// Public authentication routes
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.loginWithGoogle);

// Protected routes (require valid JWT)
router.get('/stats', verifyAdminToken, statsController.getStats);

// User management endpoints
router.get('/users', verifyAdminToken, userController.getUsers);
router.get('/users/:uid', verifyAdminToken, userController.getUserByUid);
router.put('/users/:uid', verifyAdminToken, userController.updateUserByUid);
router.delete('/users/:uid', verifyAdminToken, userController.deleteUserByUid);

// Interview endpoints
router.get('/interviews', verifyAdminToken, interviewController.getInterviews);
router.get('/interviews/:id', verifyAdminToken, interviewController.getInterviewById);
router.delete('/interviews/:id', verifyAdminToken, interviewController.deleteInterviewById);

module.exports = router;
