const { getValidationStatus, requestStatusReview } = require('../controllers/recruiter.controller');
const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');

// Routes pour les recruteurs
router.get('/validation-status', auth, getValidationStatus);
router.post('/request-review', auth, requestStatusReview);

module.exports = router;
