const { debugUserStatus, forceUpdateRecruiterStatus } = require('../controllers/debug.controller');
const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');

// Routes de debug
router.get('/user-status', auth, debugUserStatus);
router.post('/force-update-recruiter', auth, forceUpdateRecruiterStatus);

module.exports = router;
