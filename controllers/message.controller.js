const Message = require("../models/message.model");
const { getSocket } = require("../utils/socket");

exports.envoyerMessage = async (req, res) => {
  try {
    const { destinataire, contenu, offre } = req.body;
    if (!destinataire || !contenu) {
      return res.status(400).json({ message: "Destinataire et contenu requis" });
    }
    const message = await Message.create({
      expediteur: req.userId,
      destinataire,
      contenu,
      offre,
      lu: false,
      type: 'message'
    });

    // Temps réel: émettre au destinataire et à l'expéditeur pour MAJ instantanée
    try {
      const io = getSocket();
      if (io) {
        const payload = {
          _id: message._id,
          expediteur: message.expediteur,
          destinataire: message.destinataire,
          contenu: message.contenu,
          offre: message.offre,
          lu: message.lu,
          createdAt: message.createdAt
        };
        io.to(`user:${destinataire.toString()}`).emit('message:new', payload);
        io.to(`user:${req.userId.toString()}`).emit('message:new', payload);
      }
    } catch (e) {
      // no-op
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId, offreId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId requis" });
    }
    const filter = {
      $or: [
        { expediteur: req.userId, destinataire: userId },
        { expediteur: userId, destinataire: req.userId }
      ]
    };
    if (offreId) {
      filter.offre = offreId;
    }
    const messages = await Message.find(filter).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.marquerCommeLu = async (req, res) => {
  try {
    const { expediteur } = req.body;
    if (!expediteur) {
      return res.status(400).json({ message: "expediteur requis" });
    }
    const result = await Message.updateMany(
      { expediteur, destinataire: req.userId, lu: false },
      { lu: true }
    );
    res.json({ modifiedCount: result.nModified });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
