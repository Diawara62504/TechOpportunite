const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour le profil utilisateur
router.get('/profile', gamificationController.getUserProfile);
router.put('/profile/preferences', gamificationController.updatePreferences);

// Routes pour les badges
router.get('/badges', gamificationController.getAllBadges);
router.get('/badges/user', gamificationController.getUserBadges);

// Routes pour les défis
router.get('/challenges', gamificationController.getChallenges);
router.post('/challenges/:challengeId/join', gamificationController.joinChallenge);
router.get('/challenges/user', gamificationController.getUserChallenges);

// Routes pour le leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/leaderboard/regional/:region', gamificationController.getRegionalLeaderboard);

// Routes pour les récompenses
router.get('/rewards', gamificationController.getAvailableRewards);
router.post('/rewards/:rewardId/claim', gamificationController.claimReward);

// Routes internes (pour les autres services)
router.post('/award-points', gamificationController.awardPoints);
router.post('/update-stats', gamificationController.updateUserStats);

module.exports = router;
