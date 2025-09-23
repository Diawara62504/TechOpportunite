const User = require('../models/user.model');

/**
 * Middleware pour vérifier que le recruteur est approuvé
 * Doit être utilisé après le middleware d'authentification
 */
const requireApprovedRecruiter = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.userId) {
      return res.status(401).json({ 
        message: "Utilisateur non authentifié" 
      });
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(req.userId).select('role validationStatus email nom prenom');
    
    if (!user) {
      return res.status(404).json({ 
        message: "Utilisateur non trouvé" 
      });
    }

    // Vérifier que c'est un recruteur
    if (user.role !== 'recruteur') {
      return res.status(403).json({ 
        message: "Accès réservé aux recruteurs" 
      });
    }

    // Vérifier le statut de validation
    if (user.validationStatus !== 'approved') {
      let message = '';
      switch (user.validationStatus) {
        case 'pending':
          message = "Votre compte recruteur est en attente de validation par l'administrateur. Vous recevrez une notification dès qu'il sera approuvé.";
          break;
        case 'rejected':
          message = "Votre demande de compte recruteur a été refusée. Veuillez contacter l'administrateur pour plus d'informations.";
          break;
        case 'suspended':
          message = "Votre compte recruteur a été suspendu. Veuillez contacter l'administrateur pour plus d'informations.";
          break;
        default:
          message = "Votre compte recruteur n'est pas encore validé.";
      }

      return res.status(403).json({ 
        message,
        validationStatus: user.validationStatus,
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email
        }
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user._id,
      _id: user._id,
      role: user.role,
      validationStatus: user.validationStatus,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom
    };

    next();
  } catch (error) {
    console.error('Erreur dans requireApprovedRecruiter:', error);
    res.status(500).json({ 
      message: "Erreur lors de la vérification du statut" 
    });
  }
};

/**
 * Middleware pour vérifier le statut de validation sans bloquer
 * Utile pour les routes qui affichent des informations conditionnelles
 */
const checkRecruiterStatus = async (req, res, next) => {
  try {
    if (!req.userId) {
      req.recruiterStatus = { isRecruiter: false, isApproved: false };
      return next();
    }

    const user = await User.findById(req.userId).select('role validationStatus');
    
    if (!user || user.role !== 'recruteur') {
      req.recruiterStatus = { isRecruiter: false, isApproved: false };
    } else {
      req.recruiterStatus = { 
        isRecruiter: true, 
        isApproved: user.validationStatus === 'approved',
        validationStatus: user.validationStatus
      };
    }

    next();
  } catch (error) {
    console.error('Erreur dans checkRecruiterStatus:', error);
    req.recruiterStatus = { isRecruiter: false, isApproved: false };
    next();
  }
};

module.exports = {
  requireApprovedRecruiter,
  checkRecruiterStatus
};
