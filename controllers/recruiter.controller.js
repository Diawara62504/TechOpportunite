const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Obtenir le statut de validation du recruteur connecté
exports.getValidationStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non authentifié" 
      });
    }

    const user = await User.findById(userId).select('role validationStatus email nom prenom');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    if (user.role !== 'recruteur') {
      return res.status(403).json({ 
        success: false,
        message: "Accès réservé aux recruteurs" 
      });
    }

    // Récupérer les notifications récentes liées à la validation
    const notifications = await Notification.find({
      userId: userId,
      'data.action': 'recruiter_validation'
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title message type createdAt data');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          validationStatus: user.validationStatus
        },
        notifications,
        canPostOffers: user.validationStatus === 'approved'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut"
    });
  }
};

// Demander une révision du statut (pour les recruteurs rejetés)
exports.requestStatusReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non authentifié" 
      });
    }

    const user = await User.findById(userId).select('role validationStatus email nom prenom');
    
    if (!user || user.role !== 'recruteur') {
      return res.status(404).json({ 
        success: false,
        message: "Recruteur non trouvé" 
      });
    }

    if (user.validationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: "Votre compte est déjà approuvé"
      });
    }

    // Créer une notification pour les administrateurs
    const admins = await User.find({ role: 'admin' });
    
    const adminNotifications = admins.map(admin => ({
      userId: admin._id,
      title: '🔄 Demande de révision de statut',
      message: `${user.prenom} ${user.nom} (${user.email}) demande une révision de son statut de validation.`,
      type: 'info',
      data: {
        action: 'status_review_request',
        requesterId: userId,
        requesterName: `${user.prenom} ${user.nom}`,
        requesterEmail: user.email,
        currentStatus: user.validationStatus,
        message: message || '',
        timestamp: new Date()
      }
    }));

    await Notification.insertMany(adminNotifications);

    // Notification de confirmation au recruteur
    const confirmationNotification = new Notification({
      userId: userId,
      title: '✅ Demande de révision envoyée',
      message: 'Votre demande de révision a été envoyée aux administrateurs. Vous recevrez une réponse dans les plus brefs délais.',
      type: 'info',
      data: {
        action: 'review_request_sent',
        timestamp: new Date()
      }
    });

    await confirmationNotification.save();

    res.json({
      success: true,
      message: "Demande de révision envoyée avec succès"
    });
  } catch (error) {
    console.error('Erreur lors de la demande de révision:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la demande"
    });
  }
};
