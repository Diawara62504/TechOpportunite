const { 
  getConversations, 
  getConversationMessages, 
  sendMessage, 
  markMessageAsRead, 
  getMessagingStats 
} = require('../controllers/messaging.controller');
const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');

// Routes pour la messagerie
router.get('/conversations', auth, getConversations);
router.get('/messages', auth, getConversationMessages);
router.post('/send', auth, sendMessage);
router.put('/:messageId/read', auth, markMessageAsRead);
router.get('/stats', auth, getMessagingStats);

module.exports = router;
