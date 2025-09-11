const express = require('express');
const router = express.Router();
const VideoInterviewController = require('../controllers/videoInterview.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour la gestion des entretiens
router.post('/', VideoInterviewController.createInterview);
router.get('/user', VideoInterviewController.getUserInterviews);
router.get('/:interviewId', VideoInterviewController.getInterview);

// Routes pour les sessions d'entretien
router.post('/:interviewId/start', VideoInterviewController.startInterview);
router.post('/:interviewId/end', VideoInterviewController.endInterview);

// Routes pour l'analyse IA
router.get('/:interviewId/analysis', VideoInterviewController.getInterviewAnalysis);
router.post('/questions/generate', VideoInterviewController.generateAIQuestions);

// Routes pour les évaluations
router.post('/:interviewId/evaluation', VideoInterviewController.submitEvaluation);

module.exports = router;
