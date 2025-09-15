const express = require('express');
const router = express.Router();
const { gamificationController, GamificationService } = require('../controllers/gamification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour le profil utilisateur
router.get('/profile', gamificationController.getUserProfile);
router.put('/profile/preferences', gamificationController.updatePreferences);

// Routes pour les badges (liste des badges disponibles)
router.get('/badges', gamificationController.getBadges);

// Routes pour les défis
router.get('/challenges', gamificationController.getChallenges);
router.post('/challenges/:challengeId/join', gamificationController.joinChallenge);

// Routes pour le leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);

// Routes internes (pour d'autres services)
router.post('/award-points', async (req, res) => {
  try {
    const { userId, points, action, details } = req.body;
    const result = await GamificationService.awardPoints(userId || req.user._id, points, action, details);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update-stats', async (req, res) => {
  try {
    const { userId, statType, value } = req.body;
    await GamificationService.updateUserStats(userId || req.user._id, statType, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
