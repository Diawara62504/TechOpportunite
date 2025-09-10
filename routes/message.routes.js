const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes pour les messages
router.post('/send', authMiddleware, messageController.envoyerMessage);
router.get('/conversation', authMiddleware, messageController.getConversation);
router.put('/mark-read', authMiddleware, messageController.marquerCommeLu);

module.exports = router;
