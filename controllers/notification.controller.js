const notif = require("../models/notification.model");
const offer = require("../models/offer.model");
const User = require("../models/user.model");
const { getSocket } = require("../utils/socket");

exports.ajoutnotif = async (req, res) => {
  const { receveur, contenue, type, offre } = req.body;
  try {
    let notificationData = {
      expediteur: req.userId,
      contenue,
      type: type || 'general',
      offre,
      lu: false
    };

    if (type === 'candidature') {
      const offreDoc = await offer.findById(offre);
      if (!offreDoc) {
        return res.status(404).json({ message: "Offre non trouvée" });
      }
      notificationData.receveur = offreDoc.recruteur; // ✅ le recruteur reçoit
      notificationData.candidat = req.userId; // ✅ le vrai candidat
    } else {
      // Cas général : receveur passé dans le body
      notificationData.receveur = receveur;
    }

    const created = await notif.create(notificationData);

    // Émission temps réel vers le receveur
    try {
      const io = getSocket();
      if (io && created.receveur) {
        io.to(`user:${created.receveur.toString()}`).emit('notification:new', {
          _id: created._id,
          contenue: created.contenue,
          type: created.type,
          offre: created.offre,
          candidat: created.candidat,
          lu: created.lu,
          createdAt: created.createdAt
        });
      }
    } catch (e) {
      // no-op
    }

    res.json({ message: "Envoyé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.affichenotif = async (req, res) => {
  try {
    const affiche = await notif
      .find({ receveur: req.userId })
      .select("-receveur")
      .populate("expediteur", "prenom nom email")
      .populate("offre", "titre type localisation")
      .populate(
        "candidat",
        "prenom nom email titre localisation telephone linkedin github portfolio cvUrl competences preference"
      )
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
