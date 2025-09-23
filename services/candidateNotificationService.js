const User = require('../models/user.model');
const Notification = require('../models/notification.model');

class CandidateNotificationService {
  // Notifier un candidat de l'acceptation de sa candidature
  static async notifyApplicationAccepted(candidateId, offerId, recruiterId) {
    try {
      const candidate = await User.findById(candidateId);
      const recruiter = await User.findById(recruiterId);
      
      if (!candidate || !recruiter) {
        throw new Error('Utilisateur non trouvé');
      }

      const notification = new Notification({
        userId: candidateId,
        expediteur: recruiterId,
        receveur: candidateId,
        title: '🎉 Candidature acceptée !',
        message: `Félicitations ! Votre candidature a été acceptée par ${recruiter.nom} ${recruiter.prenom}. Vous pouvez maintenant commencer à échanger avec le recruteur.`,
        type: 'application_status',
        offre: offerId,
        candidat: candidateId,
        data: {
          action: 'application_accepted',
          recruiterName: `${recruiter.nom} ${recruiter.prenom}`,
          recruiterEmail: recruiter.email,
          timestamp: new Date()
        }
      });

      await notification.save();

      // Envoyer une notification WebSocket en temps réel
      try {
        const { getSocket } = require('../utils/socket');
        const io = getSocket();
        if (io) {
          io.to(`user:${candidateId}`).emit('notification:new', {
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
          to: candidate.email,
          subject: '🎉 Votre candidature a été acceptée !',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Félicitations !</h2>
              <p style="color: #666; line-height: 1.6;">
                Votre candidature a été acceptée par <strong>${recruiter.nom} ${recruiter.prenom}</strong>.
              </p>
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="color: #0c4a6e; margin-top: 0;">Prochaines étapes :</h3>
                <ul style="color: #0c4a6e;">
                  <li>Consultez vos messages pour échanger avec le recruteur</li>
                  <li>Préparez-vous pour les prochaines étapes du processus</li>
                  <li>Restez disponible pour d'éventuels entretiens</li>
                </ul>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
            </div>
          `
        });
        console.log(`Email de notification envoyé à ${candidate.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification d\'acceptation:', error);
      throw error;
    }
  }

  // Notifier un candidat du rejet de sa candidature
  static async notifyApplicationRejected(candidateId, offerId, recruiterId) {
    try {
      const candidate = await User.findById(candidateId);
      const recruiter = await User.findById(recruiterId);
      
      if (!candidate || !recruiter) {
        throw new Error('Utilisateur non trouvé');
      }

      const notification = new Notification({
        userId: candidateId,
        expediteur: recruiterId,
        receveur: candidateId,
        title: '📝 Candidature non retenue',
        message: `Votre candidature n'a pas été retenue pour cette offre. Ne vous découragez pas, d'autres opportunités vous attendent !`,
        type: 'application_status',
        offre: offerId,
        candidat: candidateId,
        data: {
          action: 'application_rejected',
          recruiterName: `${recruiter.nom} ${recruiter.prenom}`,
          timestamp: new Date()
        }
      });

      await notification.save();

      // Envoyer une notification WebSocket en temps réel
      try {
        const { getSocket } = require('../utils/socket');
        const io = getSocket();
        if (io) {
          io.to(`user:${candidateId}`).emit('notification:new', {
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

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de rejet:', error);
      throw error;
    }
  }

  // Notifier un candidat d'une nouvelle offre correspondant à ses critères
  static async notifyNewMatchingOffer(candidateId, offerId) {
    try {
      const candidate = await User.findById(candidateId);
      
      if (!candidate) {
        throw new Error('Candidat non trouvé');
      }

      const notification = new Notification({
        userId: candidateId,
        title: '🔔 Nouvelle offre qui pourrait vous intéresser',
        message: 'Une nouvelle offre d\'emploi correspondant à vos critères a été publiée. Découvrez-la dès maintenant !',
        type: 'nouvelle_offre',
        offre: offerId,
        data: {
          action: 'new_matching_offer',
          timestamp: new Date()
        }
      });

      await notification.save();

      // Envoyer une notification WebSocket en temps réel
      try {
        const { getSocket } = require('../utils/socket');
        const io = getSocket();
        if (io) {
          io.to(`user:${candidateId}`).emit('notification:new', {
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

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de nouvelle offre:', error);
      throw error;
    }
  }

  // Notifier un candidat d'un message reçu
  static async notifyNewMessage(candidateId, senderId, messageContent, offerId) {
    try {
      const candidate = await User.findById(candidateId);
      const sender = await User.findById(senderId);
      
      if (!candidate || !sender) {
        throw new Error('Utilisateur non trouvé');
      }

      const notification = new Notification({
        userId: candidateId,
        expediteur: senderId,
        receveur: candidateId,
        title: '💬 Nouveau message reçu',
        message: `Vous avez reçu un nouveau message de ${sender.nom} ${sender.prenom}`,
        type: 'general',
        offre: offerId,
        data: {
          action: 'new_message',
          senderName: `${sender.nom} ${sender.prenom}`,
          messagePreview: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
          timestamp: new Date()
        }
      });

      await notification.save();

      // Envoyer une notification WebSocket en temps réel
      try {
        const { getSocket } = require('../utils/socket');
        const io = getSocket();
        if (io) {
          io.to(`user:${candidateId}`).emit('notification:new', {
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

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de message:', error);
      throw error;
    }
  }
}

module.exports = CandidateNotificationService;
