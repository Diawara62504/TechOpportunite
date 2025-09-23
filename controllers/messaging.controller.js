const Message = require('../models/message.model');
const User = require('../models/user.model');
const Offer = require('../models/offer.model');
const Notification = require('../models/notification.model');
const { getSocket } = require('../utils/socket');

// Obtenir les conversations d'un utilisateur
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    // Récupérer toutes les conversations (groupées par interlocuteur et offre)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { expediteur: userId },
            { destinataire: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$expediteur', userId] },
              { interlocuteur: '$destinataire', offre: '$offre' },
              { interlocuteur: '$expediteur', offre: '$offre' }
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$destinataire', userId] }, { $eq: ['$lu', false] }] },
                1,
                0
              ]
            }
          },
          totalMessages: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.interlocuteur',
          foreignField: '_id',
          as: 'interlocuteur'
        }
      },
      {
        $lookup: {
          from: 'offres',
          localField: '_id.offre',
          foreignField: '_id',
          as: 'offre'
        }
      },
      {
        $unwind: '$interlocuteur'
      },
      {
        $unwind: {
          path: '$offre',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          interlocuteur: {
            _id: '$interlocuteur._id',
            nom: '$interlocuteur.nom',
            prenom: '$interlocuteur.prenom',
            email: '$interlocuteur.email',
            role: '$interlocuteur.role'
          },
          offre: {
            _id: '$offre._id',
            titre: '$offre.titre'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            contenu: '$lastMessage.contenu',
            type: '$lastMessage.type',
            createdAt: '$lastMessage.createdAt',
            lu: '$lastMessage.lu'
          },
          unreadCount: 1,
          totalMessages: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $skip: (parseInt(page) - 1) * parseInt(limit)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Compter le total de conversations
    const totalConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { expediteur: userId },
            { destinataire: userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$expediteur', userId] },
              { interlocuteur: '$destinataire', offre: '$offre' },
              { interlocuteur: '$expediteur', offre: '$offre' }
            ]
          }
        }
      },
      {
        $count: 'total'
      }
    ]);

    const total = totalConversations[0]?.total || 0;

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des conversations"
    });
  }
};

// Obtenir les messages d'une conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { interlocuteurId, offreId } = req.query;
    const { page = 1, limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    if (!interlocuteurId) {
      return res.status(400).json({
        success: false,
        message: "ID de l'interlocuteur requis"
      });
    }

    // Vérifier que l'utilisateur peut accéder à cette conversation
    const canAccess = await Message.findOne({
      $or: [
        { expediteur: userId, destinataire: interlocuteurId },
        { expediteur: interlocuteurId, destinataire: userId }
      ],
      ...(offreId && { offre: offreId })
    });

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé à cette conversation"
      });
    }

    // Récupérer les messages
    const messages = await Message.find({
      $or: [
        { expediteur: userId, destinataire: interlocuteurId },
        { expediteur: interlocuteurId, destinataire: userId }
      ],
      ...(offreId && { offre: offreId })
    })
    .populate('expediteur', 'nom prenom email role')
    .populate('destinataire', 'nom prenom email role')
    .populate('offre', 'titre')
    .sort({ createdAt: 1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

    // Marquer les messages comme lus
    await Message.updateMany(
      {
        expediteur: interlocuteurId,
        destinataire: userId,
        lu: false,
        ...(offreId && { offre: offreId })
      },
      { lu: true }
    );

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages"
    });
  }
};

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { destinataireId, contenu, offreId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    if (!destinataireId || !contenu) {
      return res.status(400).json({
        success: false,
        message: "Destinataire et contenu requis"
      });
    }

    // Vérifier que le destinataire existe
    const destinataire = await User.findById(destinataireId).select('nom prenom email role');
    if (!destinataire) {
      return res.status(404).json({
        success: false,
        message: "Destinataire non trouvé"
      });
    }

    // Vérifier que l'offre existe si fournie
    if (offreId) {
      const offre = await Offer.findById(offreId);
      if (!offre) {
        return res.status(404).json({
          success: false,
          message: "Offre non trouvée"
        });
      }
    }

    // Créer le message
    const message = new Message({
      expediteur: userId,
      destinataire: destinataireId,
      contenu,
      offre: offreId || null,
      lu: false,
      type: 'message'
    });

    await message.save();

    // Populer les données pour la réponse
    await message.populate('expediteur', 'nom prenom email role');
    await message.populate('destinataire', 'nom prenom email role');
    if (offreId) {
      await message.populate('offre', 'titre');
    }

    // Envoyer une notification WebSocket au destinataire
    try {
      const io = getSocket();
      if (io) {
        io.to(`user:${destinataireId}`).emit('message:new', {
          _id: message._id,
          expediteur: message.expediteur,
          destinataire: message.destinataire,
          contenu: message.contenu,
          offre: message.offre,
          lu: message.lu,
          type: message.type,
          createdAt: message.createdAt
        });
      }
    } catch (wsError) {
      console.error('Erreur WebSocket lors de l\'envoi du message:', wsError);
    }

    // Créer une notification pour le destinataire
    try {
      const expediteur = await User.findById(userId).select('nom prenom');
      const notification = new Notification({
        userId: destinataireId,
        expediteur: userId,
        receveur: destinataireId,
        title: '💬 Nouveau message reçu',
        message: `Vous avez reçu un nouveau message de ${expediteur.nom} ${expediteur.prenom}`,
        type: 'general',
        data: {
          action: 'new_message',
          messageId: message._id,
          expediteurName: `${expediteur.nom} ${expediteur.prenom}`,
          timestamp: new Date()
        }
      });

      await notification.save();

      // Envoyer la notification WebSocket
      if (io) {
        io.to(`user:${destinataireId}`).emit('notification:new', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
    }

    res.json({
      success: true,
      message: "Message envoyé avec succès",
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du message"
    });
  }
};

// Marquer un message comme lu
exports.markMessageAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const message = await Message.findOneAndUpdate(
      { _id: messageId, destinataire: userId, lu: false },
      { lu: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message non trouvé ou déjà lu"
      });
    }

    res.json({
      success: true,
      message: "Message marqué comme lu",
      data: message
    });
  } catch (error) {
    console.error('Erreur lors du marquage du message:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage du message"
    });
  }
};

// Obtenir les statistiques de messagerie
exports.getMessagingStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const stats = await Message.aggregate([
      {
        $match: {
          $or: [
            { expediteur: userId },
            { destinataire: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadMessages: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$destinataire', userId] }, { $eq: ['$lu', false] }] },
                1,
                0
              ]
            }
          },
          sentMessages: {
            $sum: {
              $cond: [{ $eq: ['$expediteur', userId] }, 1, 0]
            }
          },
          receivedMessages: {
            $sum: {
              $cond: [{ $eq: ['$destinataire', userId] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalMessages: 0,
      unreadMessages: 0,
      sentMessages: 0,
      receivedMessages: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};
