const Notification = require('../models/notification.model');
const User = require('../models/user.model');

// Obtenir les notifications d'un utilisateur
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    // Construire les filtres
    const filters = { userId };
    if (unreadOnly === 'true') {
      filters.lu = false;
    }

    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer les notifications
    const notifications = await Notification.find(filters)
      .populate('expediteur', 'nom prenom email')
      .populate('offre', 'titre')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total
    const total = await Notification.countDocuments(filters);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Compter les notifications non lues
    const unreadCount = await Notification.countDocuments({ userId, lu: false });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications"
    });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { lu: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    res.json({
      success: true,
      message: "Notification marquée comme lue",
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage de la notification"
    });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const result = await Notification.updateMany(
      { userId, lu: false },
      { lu: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage des notifications"
    });
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    res.json({
      success: true,
      message: "Notification supprimée",
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la notification"
    });
  }
};

// Obtenir les statistiques des notifications
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const stats = await Notification.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$lu', false] }, 1, 0] }
          },
          byType: {
            $push: {
              type: '$type',
              lu: '$lu'
            }
          }
        }
      }
    ]);

    // Calculer les statistiques par type
    const typeStats = {};
    if (stats.length > 0) {
      stats[0].byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0 };
        }
        typeStats[item.type].total++;
        if (!item.lu) {
          typeStats[item.type].unread++;
        }
      });
    }

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        unread: stats[0]?.unread || 0,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};