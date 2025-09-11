const notif = require("../models/notification.model");
const offer = require("../models/offer.model");
const User = require("../models/user.model");

exports.ajoutnotif = async (req, res) => {
  const { receveur, contenue, type, offre, candidat } = req.body;
  try {
    const ajout = await notif.create({
      expediteur: req.userId,
      receveur,
      contenue,
      type: type || 'general',
      offre,
      candidat,
      lu: false
    });
    res.json("Envoyé");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

exports.affichenotif = async (req, res) => {
  try {
    const affiche = await notif
      .find({ receveur: req.userId })
      .select("-receveur")
      .populate("expediteur", "prenom nom email")
      .populate("offre", "titre type localisation")
      .populate("candidat", "prenom nom email")
      .sort({ createdAt: -1 }); // Trier par date décroissante
    res.json(affiche);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Marquer une notification comme lue
exports.marquerCommeLu = async (req, res) => {
  try {
    const notification = await notif.findByIdAndUpdate(
      req.params.id,
      { lu: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Compter les notifications non lues
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notif.countDocuments({ 
      receveur: req.userId, 
      lu: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une notification pour changement de statut de candidature
exports.notifierChangementStatut = async (candidatId, offreId, nouveauStatut) => {
  try {
    const offre = await offer.findById(offreId).populate('source', 'nom prenom');
    const candidat = await User.findById(candidatId);

    let message = '';
    if (nouveauStatut === 'accepte') {
      message = `Félicitations ! Votre candidature pour "${offre.titre}" a été acceptée.`;
    } else if (nouveauStatut === 'refuse') {
      message = `Votre candidature pour "${offre.titre}" a été refusée.`;
    }

    if (message) {
      await notif.create({
        expediteur: offre.source._id, // Le recruteur
        receveur: candidatId, // Le candidat
        contenue: message,
        type: 'statut_candidature',
        offre: offreId,
        candidat: candidatId,
        lu: false
      });
    }
  } catch (error) {
    console.error('Erreur lors de la création de notification de statut:', error);
  }
};
