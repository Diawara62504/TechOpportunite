const express = require('express');
const router = express.Router();
const ValidationService = require('../services/validationService');

router.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body || {};
    const result = await ValidationService.validateProfessionalEmail(email || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ isValid: false, reason: 'Erreur serveur' });
  }
});

module.exports = router;