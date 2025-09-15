const express = require('express');
const router = express.Router();
const MarketplaceController = require('../controllers/marketplace.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
// Le middleware exporte directement la fonction, on l'utilise donc telle quelle
router.use(authMiddleware);

// Routes pour les profils talents
router.get('/talent/profile', MarketplaceController.getMyTalentProfile);
router.post('/talent/profile', MarketplaceController.createOrUpdateTalentProfile);
router.put('/talent/profile', MarketplaceController.createOrUpdateTalentProfile);
router.get('/talent/:talentId', MarketplaceController.getTalentProfile);

// Routes de recherche
router.get('/talents/search', MarketplaceController.searchTalents);

// Routes pour les demandes de talents
router.post('/requests', MarketplaceController.createTalentRequest);
router.get('/requests/:requestId/matches', MarketplaceController.getMatchesForRequest);

// Routes pour les matches IA
router.get('/matches/talent', MarketplaceController.getMatchesForTalent);
router.put('/matches/:matchId/status', MarketplaceController.updateMatchStatus);

// Routes pour les statistiques
router.get('/stats', MarketplaceController.getMarketplaceStats);

module.exports = router;
