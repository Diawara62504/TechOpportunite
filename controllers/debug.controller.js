const User = require('../models/user.model');
const Offer = require('../models/offer.model');
const Notification = require('../models/notification.model');

// Endpoint de debug pour vérifier le statut de l'utilisateur connecté
exports.debugUserStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(userId).select('nom prenom email role validationStatus dateCreation');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier les permissions
    const canPostOffers = user.role === 'recruteur' && user.validationStatus === 'approved';
    const canAccessRecruiterDashboard = user.role === 'recruteur' && user.validationStatus === 'approved';

    // Si c'est un recruteur, récupérer ses offres
    let offers = [];
    if (user.role === 'recruteur') {
      offers = await Offer.find({ source: userId }).select('titre statut date').sort({ date: -1 });
    }

    // Récupérer les dernières notifications
    const notifications = await Notification.find({ userId })
      .select('title message type createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          validationStatus: user.validationStatus,
          dateCreation: user.dateCreation
        },
        permissions: {
          canPostOffers,
          canAccessRecruiterDashboard
        },
        offers: offers,
        notifications: notifications,
        debug: {
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du debug:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du debug",
      error: error.message
    });
  }
};

// Endpoint pour forcer la mise à jour du statut d'un recruteur (admin seulement)
exports.forceUpdateRecruiterStatus = async (req, res) => {
  try {
    const { recruiterId, newStatus } = req.body;
    const adminId = req.userId;

    // Vérifier que l'utilisateur est admin
    const admin = await User.findById(adminId).select('role');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs peuvent utiliser cette fonction."
      });
    }

    // Vérifier que le nouveau statut est valide
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide. Statuts valides: " + validStatuses.join(', ')
      });
    }

    // Mettre à jour le statut
    const recruiter = await User.findByIdAndUpdate(
      recruiterId,
      { validationStatus: newStatus },
      { new: true }
    ).select('nom prenom email role validationStatus');

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruteur non trouvé"
      });
    }

    // Envoyer une notification de changement de statut
    try {
      const { NotificationService } = require('../services/notificationService');
      await NotificationService.sendRecruiterValidationNotification(recruiterId, newStatus, adminId);
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
    }

    res.json({
      success: true,
      message: `Statut du recruteur mis à jour vers "${newStatus}"`,
      data: {
        recruiter: {
          id: recruiter._id,
          nom: recruiter.nom,
          prenom: recruiter.prenom,
          email: recruiter.email,
          role: recruiter.role,
          validationStatus: recruiter.validationStatus
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour forcée:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message
    });
  }
};
