const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const tokenValide = require('../middlewares/auth.middleware');

// Middleware pour vérifier le rôle admin
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
  next();
};

// Appliquer le middleware d'authentification et d'admin à toutes les routes
router.use(tokenValide);
router.use(requireAdmin);

// Obtenir les utilisateurs selon leur statut
router.get('/users', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const users = await User.find({ validationStatus: status })
      .select('-password')
      .sort({ dateCreation: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les statistiques
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      pendingUsers: await User.countDocuments({ validationStatus: 'pending' }),
      approvedUsers: await User.countDocuments({ validationStatus: 'approved' }),
      rejectedUsers: await User.countDocuments({ validationStatus: 'rejected' }),
      suspendedUsers: await User.countDocuments({ validationStatus: 'suspended' })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Valider/Rejeter un utilisateur
router.post('/users/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
      case 'reactivate':
        newStatus = 'approved';
        break;
      default:
        return res.status(400).json({ message: 'Action invalide' });
    }

    user.validationStatus = newStatus;
    await user.save();

    res.json({ message: 'Statut utilisateur mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;