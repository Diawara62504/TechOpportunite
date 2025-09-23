const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Report = require('../models/report.model');
const AdminAction = require('../models/adminAction.model');
const tokenValide = require('../middlewares/auth.middleware');

// Middleware pour vérifier le rôle admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    next();
  } catch (error) {
    console.error('Erreur dans le middleware requireAdmin:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Appliquer le middleware d'authentification et d'admin à toutes les routes
router.use(tokenValide);
router.use(requireAdmin);

// Obtenir les utilisateurs selon leur statut
router.get('/users', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * parseInt(limit);
    let query = { validationStatus: status };
    
    // Ajout de la recherche
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    const total = await User.countDocuments(query);
    // Enrichir les données avec les statistiques
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const stats = await getUserStats(user._id);
      return { ...user, stats };
    }));
    res.json({
      users: enrichedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
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

    const previousStatus = user.validationStatus;
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

    // Logger l'action admin
    await logAdminAction(req.user.id, `${action}_user`, userId,
      { previousStatus, newStatus }, req);

    res.json({ message: 'Statut utilisateur mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fonction pour obtenir les statistiques d'un utilisateur
const getUserStats = async (userId) => {
  try {
    const Offer = require('../models/offer.model');

    // Statistiques pour les recruteurs
    const offresPubliees = await Offer.countDocuments({ source: userId });
    const candidaturesRecues = await Offer.aggregate([
      { $match: { source: userId } },
      { $project: { candidaturesCount: { $size: "$candidatures" } } },
      { $group: { _id: null, total: { $sum: "$candidaturesCount" } } }
    ]);

    // Statistiques pour les candidats
    const candidaturesEnvoyees = await Offer.countDocuments({
      "candidatures.candidat": userId
    });

    return {
      offresPubliees,
      candidaturesRecues: candidaturesRecues[0]?.total || 0,
      candidaturesEnvoyees
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      offresPubliees: 0,
      candidaturesRecues: 0,
      candidaturesEnvoyees: 0
    };
  }
};

// Fonction pour calculer le score de crédibilité
const calculateCredibilityScore = (user) => {
  let score = 0;

  // Email vérifié (20 points)
  if (user.credibilityIndicators?.emailVerified) score += 20;

  // CV présent (15 points)
  if (user.credibilityIndicators?.hasCV || user.cvUrl) score += 15;

  // Profil complété (20 points)
  if (user.credibilityIndicators?.profileCompleted) {
    const requiredFields = ['titre', 'entreprise', 'localisation', 'about'];
    const completedFields = requiredFields.filter(field => user[field] && user[field].trim() !== '');
    score += (completedFields.length / requiredFields.length) * 20;
  }

  // Références (15 points)
  if (user.credibilityIndicators?.hasReferences) score += 15;

  // Expérience professionnelle (15 points)
  if (user.experience && user.experience.length > 0) score += 15;

  // Formation (10 points)
  if (user.formation && user.formation.length > 0) score += 10;

  // Compétences (5 points)
  if (user.competences && user.competences.length > 0) score += 5;

  return Math.min(Math.max(score, 0), 100);
};

// Fonction pour logger les actions admin
const logAdminAction = async (adminId, action, targetUserId, details = {}, req) => {
  try {
    await AdminAction.create({
      admin: adminId,
      action,
      targetUser: targetUserId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Erreur lors du logging de l\'action admin:', error);
  }
};

// Valider/Rejeter plusieurs utilisateurs en lot
router.post('/users/batch-action', async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Liste d\'utilisateurs requise' });
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
      default:
        return res.status(400).json({ message: 'Action invalide' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { validationStatus: newStatus }
    );

    // Logger l'action pour chaque utilisateur
    for (const userId of userIds) {
      await logAdminAction(req.user.id, `${action}_user`, userId, { batch: true }, req);
    }

    res.json({
      message: `${result.modifiedCount} utilisateurs mis à jour`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le score de crédibilité d'un utilisateur
router.put('/users/:userId/credibility', async (req, res) => {
  try {
    const { userId } = req.params;
    const { indicators } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les indicateurs
    if (indicators) {
      user.credibilityIndicators = { ...user.credibilityIndicators, ...indicators };
    }

    // Recalculer le score
    user.credibilityScore = calculateCredibilityScore(user);
    await user.save();

    await logAdminAction(req.user.id, 'update_credibility', userId,
      { indicators, newScore: user.credibilityScore }, req);

    res.json({
      message: 'Score de crédibilité mis à jour',
      credibilityScore: user.credibilityScore,
      indicators: user.credibilityIndicators
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les signalements
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ status })
      .populate('reporter', 'nom prenom email')
      .populate('reportedUser', 'nom prenom email role')
      .populate('resolvedBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ status });

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Traiter un signalement
router.post('/reports/:reportId/:action', async (req, res) => {
  try {
    const { reportId, action } = req.params;
    const { adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    let adminAction = 'none';
    let newStatus = 'resolved';

    switch (action) {
      case 'resolve':
        adminAction = 'warning';
        newStatus = 'resolved';
        break;
      case 'suspend':
        adminAction = 'suspension';
        newStatus = 'resolved';

        // Suspendre l'utilisateur signalé
        await User.findByIdAndUpdate(report.reportedUser, {
          validationStatus: 'suspended',
          $inc: { 'credibilityIndicators.reportsCount': 1 }
        });
        break;
      case 'ban':
        adminAction = 'ban';
        newStatus = 'resolved';

        // Bannir l'utilisateur
        await User.findByIdAndUpdate(report.reportedUser, {
          validationStatus: 'suspended',
          $inc: { 'credibilityIndicators.reportsCount': 1 }
        });
        break;
      case 'dismiss':
        newStatus = 'dismissed';
        break;
      default:
        return res.status(400).json({ message: 'Action invalide' });
    }

    report.status = newStatus;
    report.adminAction = adminAction;
    report.adminNotes = adminNotes || '';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    await report.save();

    await logAdminAction(req.user.id, `resolve_report`, report.reportedUser,
      { reportId, action: adminAction, notes: adminNotes }, req);

    res.json({ message: 'Signalement traité avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir l'historique des actions admin
router.get('/actions', async (req, res) => {
  try {
    const { page = 1, limit = 20, admin, action, targetUser } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (admin) filter.admin = admin;
    if (action) filter.action = action;
    if (targetUser) filter.targetUser = targetUser;

    const actions = await AdminAction.find(filter)
      .populate('admin', 'nom prenom email')
      .populate('targetUser', 'nom prenom email role')
      .populate('targetReport')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminAction.countDocuments(filter);

    res.json({
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistiques détaillées pour l'admin
router.get('/detailed-stats', async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      pendingUsers: await User.countDocuments({ validationStatus: 'pending' }),
      approvedUsers: await User.countDocuments({ validationStatus: 'approved' }),
      rejectedUsers: await User.countDocuments({ validationStatus: 'rejected' }),
      suspendedUsers: await User.countDocuments({ validationStatus: 'suspended' }),

      // Statistiques par rôle
      candidates: await User.countDocuments({ role: 'candidat' }),
      recruiters: await User.countDocuments({ role: 'recruteur' }),
      admins: await User.countDocuments({ role: 'admin' }),

      // Statistiques de crédibilité
      highCredibility: await User.countDocuments({ credibilityScore: { $gte: 80 } }),
      mediumCredibility: await User.countDocuments({ credibilityScore: { $gte: 50, $lt: 80 } }),
      lowCredibility: await User.countDocuments({ credibilityScore: { $lt: 50 } }),

      // Statistiques des signalements
      totalReports: await Report.countDocuments(),
      pendingReports: await Report.countDocuments({ status: 'pending' }),
      resolvedReports: await Report.countDocuments({ status: 'resolved' }),
      dismissedReports: await Report.countDocuments({ status: 'dismissed' }),

      // Actions admin récentes (dernière semaine)
      recentActions: await AdminAction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un signalement (pour les utilisateurs)
router.post('/reports', tokenValide, async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;

    if (req.user.id === reportedUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason,
      description
    });

    res.status(201).json({ message: 'Signalement créé avec succès', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;