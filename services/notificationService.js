const User = require('../models/user.model');
const Notification = require('../models/notification.model');

class NotificationService {
  // Envoyer une notification de validation de recruteur
  static async sendRecruiterValidationNotification(recruiterId, status, adminId) {
    try {
      const recruiter = await User.findById(recruiterId);
      if (!recruiter) {
        throw new Error('Recruteur non trouvé');
      }

      let title, message, type;

      switch (status) {
        case 'validated':
          title = '🎉 Votre compte recruteur a été validé !';
          message = 'Félicitations ! Votre compte recruteur a été validé par nos administrateurs. Vous pouvez maintenant publier des offres d\'emploi et commencer à recruter des talents.';
          type = 'success';
          break;
        case 'rejected':
          title = '❌ Validation de compte refusée';
          message = 'Votre demande de compte recruteur a été refusée. Veuillez contacter l\'administrateur pour plus d\'informations.';
          type = 'error';
          break;
        case 'suspended':
          title = '⚠️ Compte suspendu';
          message = 'Votre compte recruteur a été temporairement suspendu. Veuillez contacter l\'administrateur pour plus d\'informations.';
          type = 'warning';
          break;
        default:
          return;
      }

      // Créer la notification
      const notification = new Notification({
        userId: recruiterId,
        title,
        message,
        type,
        data: {
          action: 'recruiter_validation',
          status,
          adminId,
          timestamp: new Date()
        }
      });

      await notification.save();

      // TODO: Ajouter l'envoi d'email ici si nécessaire
      console.log(`Notification envoyée au recruteur ${recruiter.email}: ${title}`);

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  }

  // Envoyer une notification de nouvelle inscription de recruteur aux admins
  static async notifyAdminsNewRecruiter(recruiterId) {
    try {
      const recruiter = await User.findById(recruiterId);
      if (!recruiter) {
        throw new Error('Recruteur non trouvé');
      }

      // Trouver tous les admins
      const admins = await User.find({ role: 'admin' });
      
      const notifications = admins.map(admin => ({
        userId: admin._id,
        title: '👤 Nouveau recruteur en attente de validation',
        message: `${recruiter.prenom} ${recruiter.nom} (${recruiter.email}) s'est inscrit comme recruteur et attend votre validation.`,
        type: 'info',
        data: {
          action: 'new_recruiter',
          recruiterId,
          recruiterName: `${recruiter.prenom} ${recruiter.nom}`,
          recruiterEmail: recruiter.email,
          timestamp: new Date()
        }
      }));

      await Notification.insertMany(notifications);
      console.log(`Notifications envoyées à ${admins.length} administrateurs pour le nouveau recruteur ${recruiter.email}`);

      return notifications;
    } catch (error) {
      console.error('Erreur lors de la notification aux admins:', error);
      throw error;
    }
  }

  // Envoyer une notification de rappel aux recruteurs en attente
  static async sendPendingReminder(recruiterId) {
    try {
      const recruiter = await User.findById(recruiterId);
      if (!recruiter || recruiter.validationStatus !== 'pending') {
        return;
      }

      const notification = new Notification({
        userId: recruiterId,
        title: '⏳ Validation en cours',
        message: 'Votre compte recruteur est toujours en cours de validation. Nos administrateurs examinent votre demande et vous contacteront bientôt.',
        type: 'info',
        data: {
          action: 'pending_reminder',
          timestamp: new Date()
        }
      });

      await notification.save();
      console.log(`Rappel envoyé au recruteur ${recruiter.email}`);

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
