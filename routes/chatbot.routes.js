const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes publiques (pas d'authentification requise)
router.post('/conversation/start', ChatbotController.demarrerConversation);
router.post('/message', ChatbotController.envoyerMessage);
router.get('/conversation/:conversationId/history', ChatbotController.obtenirHistorique);

// Routes avec authentification optionnelle (pour les utilisateurs connectés)
router.post('/conversation/:conversationId/satisfaction', ChatbotController.evaluerSatisfaction);
router.post('/conversation/:conversationId/transfer', ChatbotController.demanderTransfertHumain);
router.post('/conversation/:conversationId/close', ChatbotController.fermerConversation);

// Routes administratives (authentification requise)
router.use('/admin', authMiddleware.verifyToken);
router.get('/admin/statistics', ChatbotController.obtenirStatistiques);
router.post('/admin/knowledge', ChatbotController.ajouterConnaissance);
router.get('/admin/knowledge/search', ChatbotController.rechercherConnaissances);

module.exports = router;
