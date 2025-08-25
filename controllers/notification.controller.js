const notif = require("../models/notification.model");
const offer = require("../models/offer.model");

exports.ajoutnotif = async (req, res) => {
  const { receveur, contenue } = req.body;
  try {
    const ajout = await notif.create({
      expediteur: req.userId,
      receveur,
      contenue,
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
      .populate("expediteur", "prenom nom");
    res.json(affiche);
  } catch (error) {
    res.status(500).json(error.message);
  }
};
