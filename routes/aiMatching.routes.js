const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getRecommendationsForCandidate,
  getBestCandidatesForOffer,
  calculateSpecificMatch,
  getMatchingHistory,
  getMatchingStats
} = require('../controllers/aiMatching.controller');

// Routes pour les candidats
router.get('/recommendations', authMiddleware, getRecommendationsForCandidate);
router.get('/history', authMiddleware, getMatchingHistory);
router.get('/stats', authMiddleware, getMatchingStats);

// Routes pour les recruteurs
router.get('/candidates/:offreId', authMiddleware, getBestCandidatesForOffer);

// Routes communes
router.get('/calculate/:candidatId/:offreId', authMiddleware, calculateSpecificMatch);

module.exports = router;
