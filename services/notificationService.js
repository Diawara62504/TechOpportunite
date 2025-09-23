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
        case 'approved':
          title = '🎉 Votre compte recruteur a été approuvé !';
          message = 'Félicitations ! Votre compte recruteur a été approuvé par nos administrateurs. Vous pouvez maintenant publier des offres d\'emploi et commencer à recruter des talents.';
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

      // Envoyer une notification WebSocket en temps réel
      try {
        const { getSocket } = require('../utils/socket');
        const io = getSocket();
        if (io) {
          io.to(`user:${recruiterId}`).emit('notification:new', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: notification.createdAt
          });
        }
      } catch (wsError) {
        console.error('Erreur WebSocket lors de l\'envoi de notification:', wsError);
      }

      // Envoyer un email de notification
      try {
        const { sendEmail } = require('../utils/mailer');
        await sendEmail({
          to: recruiter.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${title}</h2>
              <p style="color: #666; line-height: 1.6;">${message}</p>
              ${status === 'approved' ? `
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="color: #0c4a6e; margin-top: 0;">Prochaines étapes :</h3>
                  <ul style="color: #0c4a6e;">
                    <li>Connectez-vous à votre tableau de bord recruteur</li>
                    <li>Publiez votre première offre d'emploi</li>
                    <li>Explorez les profils des candidats</li>
                  </ul>
                </div>
              ` : ''}
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
            </div>
          `
        });
        console.log(`Email de notification envoyé à ${recruiter.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      }

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
