const User = require('../models/user.model');
const AdminAction = require('../models/adminAction.model');
const NotificationService = require('../services/notificationService');

// Obtenir la liste des recruteurs avec pagination et filtres
exports.getRecruiters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      search = '',
      sortBy = 'dateCreation',
      sortOrder = 'desc'
    } = req.query;

    // Construire les filtres
    const filters = { role: 'recruteur' };
    
    if (status !== 'all') {
      filters.validationStatus = status;
    }
    
    if (search) {
      filters.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { entreprise: { $regex: search, $options: 'i' } }
      ];
    }

    // Options de tri
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Exécuter la requête
    const [recruiters, totalCount] = await Promise.all([
      User.find(filters)
        .select('-password -__v')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filters)
    ]);

    // Calculer les statistiques
    const stats = await User.aggregate([
      { $match: { role: 'recruteur' } },
      {
        $group: {
          _id: '$validationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        recruiters,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        },
        stats: statusCounts
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des recruteurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recruteurs'
    });
  }
};

// Obtenir les détails d'un recruteur
exports.getRecruiterDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recruiter = await User.findById(id)
      .select('-password -__v')
      .lean();

    if (!recruiter || recruiter.role !== 'recruteur') {
      return res.status(404).json({
        success: false,
        message: 'Recruteur non trouvé'
      });
    }

    // Obtenir l'historique des actions admin pour ce recruteur
    const adminActions = await AdminAction.find({ targetUserId: id })
      .populate('adminId', 'nom prenom email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        recruiter,
        adminActions
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails'
    });
  }
};

// Mettre à jour le statut d'un recruteur
exports.updateRecruiterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    const recruiter = await User.findById(id);
    if (!recruiter || recruiter.role !== 'recruteur') {
      return res.status(404).json({
        success: false,
        message: 'Recruteur non trouvé'
      });
    }

    const previousStatus = recruiter.validationStatus;
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
        return res.status(400).json({
          success: false,
          message: 'Action invalide'
        });
    }

    // Mettre à jour le statut
    recruiter.validationStatus = newStatus;
    await recruiter.save();

    // Envoyer une notification au recruteur
    try {
      await NotificationService.sendRecruiterValidationNotification(id, newStatus, adminId);
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      // Ne pas faire échouer la requête si la notification échoue
    }

    // Logger l'action admin
    await AdminAction.create({
      adminId,
      action: `${action}_recruiter`,
      targetUserId: id,
      details: {
        previousStatus,
        newStatus,
        reason: reason || '',
        timestamp: new Date()
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Recruteur ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : action === 'suspend' ? 'suspendu' : 'réactivé'} avec succès`,
      data: {
        recruiter: {
          id: recruiter._id,
          nom: recruiter.nom,
          prenom: recruiter.prenom,
          email: recruiter.email,
          validationStatus: recruiter.validationStatus
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// Actions en lot sur plusieurs recruteurs
exports.bulkUpdateRecruiters = async (req, res) => {
  try {
    const { recruiterIds, action, reason } = req.body;
    const adminId = req.user.id;

    if (!Array.isArray(recruiterIds) || recruiterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste des recruteurs requise'
      });
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
        return res.status(400).json({
          success: false,
          message: 'Action invalide'
        });
    }

    // Mettre à jour tous les recruteurs
    const result = await User.updateMany(
      { 
        _id: { $in: recruiterIds },
        role: 'recruteur'
      },
      { validationStatus: newStatus }
    );

    // Logger l'action pour chaque recruteur
    const adminActions = recruiterIds.map(recruiterId => ({
      adminId,
      action: `bulk_${action}_recruiter`,
      targetUserId: recruiterId,
      details: {
        newStatus,
        reason: reason || '',
        batchAction: true,
        timestamp: new Date()
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }));

    await AdminAction.insertMany(adminActions);

    res.json({
      success: true,
      message: `${result.modifiedCount} recruteur(s) mis à jour avec succès`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour en lot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour en lot'
    });
  }
};

// Obtenir les statistiques générales
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalRecruiters,
      pendingRecruiters,
      approvedRecruiters,
      rejectedRecruiters,
      suspendedRecruiters,
      recentActions
    ] = await Promise.all([
      User.countDocuments({ role: 'recruteur' }),
      User.countDocuments({ role: 'recruteur', validationStatus: 'pending' }),
      User.countDocuments({ role: 'recruteur', validationStatus: 'approved' }),
      User.countDocuments({ role: 'recruteur', validationStatus: 'rejected' }),
      User.countDocuments({ role: 'recruteur', validationStatus: 'suspended' }),
      AdminAction.find()
        .populate('adminId', 'nom prenom')
        .populate('targetUserId', 'nom prenom email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalRecruiters,
          pending: pendingRecruiters,
          approved: approvedRecruiters,
          rejected: rejectedRecruiters,
          suspended: suspendedRecruiters
        },
        recentActions
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
