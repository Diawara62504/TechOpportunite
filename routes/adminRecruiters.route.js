const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const tokenValide = require('../middlewares/auth.middleware');

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const User = require('../models/user.model');
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions'
    });
  }
};

// Appliquer l'authentification et la vérification admin à toutes les routes
router.use(tokenValide);
router.use(requireAdmin);

// Routes pour l'administration des recruteurs
router.get('/recruiters', adminController.getRecruiters);
router.get('/recruiters/:id', adminController.getRecruiterDetails);
router.put('/recruiters/:id/status', adminController.updateRecruiterStatus);
router.put('/recruiters/bulk-status', adminController.bulkUpdateRecruiters);
router.get('/stats', adminController.getAdminStats);

module.exports = router;
