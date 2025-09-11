const {
  Badge,
  Niveau,
  UserGamification,
  Challenge,
  Leaderboard,
  Reward
} = require('../models/gamification.model');
const { AnalyticsService } = require('./analytics.controller');

// Service de gamification
class GamificationService {
  
  // Initialiser le profil de gamification d'un utilisateur
  static async initializeUserGamification(userId) {
    try {
      let userGamif = await UserGamification.findOne({ utilisateur: userId });
      
      if (!userGamif) {
        userGamif = new UserGamification({
          utilisateur: userId,
          points: { total: 0, semaine: 0, mois: 0 },
          niveau: { actuel: 1, progression: 0 },
          badges: [],
          statistiques: {
            testsCompletes: 0,
            certificationObtenues: 0,
            candidaturesEnvoyees: 0,
            joursConsecutifs: 0,
            profileCompletion: 0,
            referrals: 0
          }
        });
        
        await userGamif.save();
        
        // Donner le badge de bienvenue
        await this.awardBadge(userId, 'welcome_badge');
      }
      
      return userGamif;
    } catch (error) {
      console.error('Erreur initialisation gamification:', error);
      throw error;
    }
  }
  
  // Attribuer des points à un utilisateur
  static async awardPoints(userId, points, action, details = {}) {
    try {
      const userGamif = await UserGamification.findOne({ utilisateur: userId });
      if (!userGamif) {
        await this.initializeUserGamification(userId);
        return this.awardPoints(userId, points, action, details);
      }
      
      // Ajouter les points
      userGamif.points.total += points;
      userGamif.points.semaine += points;
      userGamif.points.mois += points;
      
      // Ajouter à l'historique
      userGamif.historique.push({
        action,
        points,
        details
      });
      
      // Vérifier si l'utilisateur monte de niveau
      const nouveauNiveau = await this.checkLevelUp(userGamif);
      
      await userGamif.save();
      
      // Vérifier les badges à débloquer
      await this.checkBadges(userId, action, details);
      
      // Tracker l'événement
      AnalyticsService.trackEvent({ user: { _id: userId } }, 'points_earned', {
        points,
        action,
        newTotal: userGamif.points.total
      });
      
      return {
        pointsEarned: points,
        totalPoints: userGamif.points.total,
        levelUp: nouveauNiveau,
        newLevel: userGamif.niveau.actuel
      };
      
    } catch (error) {
      console.error('Erreur attribution points:', error);
      throw error;
    }
  }
  
  // Vérifier et gérer la montée de niveau
  static async checkLevelUp(userGamif) {
    try {
      const niveauActuel = await Niveau.findOne({ niveau: userGamif.niveau.actuel });
      const niveauSuivant = await Niveau.findOne({ niveau: userGamif.niveau.actuel + 1 });
      
      if (niveauSuivant && userGamif.points.total >= niveauSuivant.pointsRequis) {
        userGamif.niveau.actuel = niveauSuivant.niveau;
        userGamif.niveau.progression = 0;
        
        // Récompenses de niveau
        await this.awardPoints(userGamif.utilisateur, niveauSuivant.niveau * 50, 'level_up');
        
        return true;
      } else if (niveauSuivant) {
        // Calculer la progression vers le niveau suivant
        const pointsNecessaires = niveauSuivant.pointsRequis - (niveauActuel?.pointsRequis || 0);
        const pointsActuels = userGamif.points.total - (niveauActuel?.pointsRequis || 0);
        userGamif.niveau.progression = Math.min(100, (pointsActuels / pointsNecessaires) * 100);
      }
      
      return false;
    } catch (error) {
      console.error('Erreur vérification niveau:', error);
      return false;
    }
  }
  
  // Attribuer un badge
  static async awardBadge(userId, badgeName) {
    try {
      const badge = await Badge.findOne({ nom: badgeName, actif: true });
      if (!badge) return false;
      
      const userGamif = await UserGamification.findOne({ utilisateur: userId });
      if (!userGamif) {
        await this.initializeUserGamification(userId);
        return this.awardBadge(userId, badgeName);
      }
      
      // Vérifier si l'utilisateur a déjà ce badge
      const hasBadge = userGamif.badges.some(b => b.badge.toString() === badge._id.toString());
      if (hasBadge) return false;
      
      // Ajouter le badge
      userGamif.badges.push({
        badge: badge._id,
        dateObtention: new Date()
      });
      
      // Ajouter les points du badge
      userGamif.points.total += badge.points;
      userGamif.points.semaine += badge.points;
      userGamif.points.mois += badge.points;
      
      await userGamif.save();
      
      // Tracker l'événement
      AnalyticsService.trackEvent({ user: { _id: userId } }, 'badge_earned', {
        badge: badgeName,
        points: badge.points
      });
      
      return true;
    } catch (error) {
      console.error('Erreur attribution badge:', error);
      return false;
    }
  }
  
  // Vérifier les conditions des badges
  static async checkBadges(userId, action, details = {}) {
    try {
      const userGamif = await UserGamification.findOne({ utilisateur: userId })
        .populate('badges.badge');
      
      const badges = await Badge.find({ actif: true });
      
      for (const badge of badges) {
        // Vérifier si l'utilisateur a déjà ce badge
        const hasBadge = userGamif.badges.some(b => 
          b.badge._id.toString() === badge._id.toString()
        );
        if (hasBadge) continue;
        
        // Vérifier les conditions
        let conditionMet = false;
        
        switch (badge.conditions.type) {
          case 'test_count':
            conditionMet = userGamif.statistiques.testsCompletes >= badge.conditions.valeur;
            break;
          case 'certification_count':
            conditionMet = userGamif.statistiques.certificationObtenues >= badge.conditions.valeur;
            break;
          case 'application_count':
            conditionMet = userGamif.statistiques.candidaturesEnvoyees >= badge.conditions.valeur;
            break;
          case 'profile_completion':
            conditionMet = userGamif.statistiques.profileCompletion >= badge.conditions.valeur;
            break;
          case 'login_streak':
            conditionMet = userGamif.statistiques.joursConsecutifs >= badge.conditions.valeur;
            break;
          case 'test_score':
            if (action === 'test_complete' && details.score >= badge.conditions.valeur) {
              conditionMet = true;
            }
            break;
        }
        
        if (conditionMet) {
          await this.awardBadge(userId, badge.nom);
        }
      }
    } catch (error) {
      console.error('Erreur vérification badges:', error);
    }
  }
  
  // Mettre à jour les statistiques utilisateur
  static async updateUserStats(userId, statType, value = 1) {
    try {
      const userGamif = await UserGamification.findOne({ utilisateur: userId });
      if (!userGamif) {
        await this.initializeUserGamification(userId);
        return this.updateUserStats(userId, statType, value);
      }
      
      switch (statType) {
        case 'test_complete':
          userGamif.statistiques.testsCompletes += value;
          await this.awardPoints(userId, 20, 'test_complete');
          break;
        case 'certification_earned':
          userGamif.statistiques.certificationObtenues += value;
          await this.awardPoints(userId, 100, 'certification_earned');
          break;
        case 'application_sent':
          userGamif.statistiques.candidaturesEnvoyees += value;
          await this.awardPoints(userId, 10, 'application_sent');
          break;
        case 'profile_completion':
          userGamif.statistiques.profileCompletion = value;
          if (value >= 100) {
            await this.awardPoints(userId, 50, 'profile_complete');
          }
          break;
        case 'daily_login':
          const today = new Date();
          const lastLogin = userGamif.statistiques.dernierLogin;
          
          if (lastLogin) {
            const diffTime = Math.abs(today - lastLogin);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              userGamif.statistiques.joursConsecutifs += 1;
            } else if (diffDays > 1) {
              userGamif.statistiques.joursConsecutifs = 1;
            }
          } else {
            userGamif.statistiques.joursConsecutifs = 1;
          }
          
          userGamif.statistiques.dernierLogin = today;
          await this.awardPoints(userId, 5, 'daily_login');
          break;
      }
      
      await userGamif.save();
      await this.checkBadges(userId, statType, { value });
      
    } catch (error) {
      console.error('Erreur mise à jour stats:', error);
    }
  }
  
  // Générer le leaderboard
  static async generateLeaderboard(type = 'global', options = {}) {
    try {
      const { region, technologie, limit = 100 } = options;
      
      let query = {};
      let sortField = { 'points.total': -1 };
      
      if (type === 'weekly') {
        sortField = { 'points.semaine': -1 };
      } else if (type === 'monthly') {
        sortField = { 'points.mois': -1 };
      }
      
      const users = await UserGamification.find(query)
        .populate('utilisateur', 'nom prenom email region')
        .sort(sortField)
        .limit(limit);
      
      const classement = users.map((user, index) => ({
        position: index + 1,
        utilisateur: user.utilisateur,
        points: type === 'weekly' ? user.points.semaine : 
                type === 'monthly' ? user.points.mois : user.points.total,
        niveau: user.niveau.actuel,
        badges: user.badges.length
      }));
      
      // Sauvegarder le leaderboard
      const leaderboard = new Leaderboard({
        type,
        region,
        technologie,
        classement,
        periode: {
          debut: new Date(),
          fin: new Date()
        }
      });
      
      await leaderboard.save();
      
      return classement;
    } catch (error) {
      console.error('Erreur génération leaderboard:', error);
      throw error;
    }
  }
}

// Contrôleurs API
const gamificationController = {
  
  // Obtenir le profil de gamification d'un utilisateur
  getUserProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      
      let userGamif = await UserGamification.findOne({ utilisateur: userId })
        .populate('badges.badge')
        .populate('utilisateur', 'nom prenom');
      
      if (!userGamif) {
        userGamif = await GamificationService.initializeUserGamification(userId);
        userGamif = await UserGamification.findOne({ utilisateur: userId })
          .populate('badges.badge')
          .populate('utilisateur', 'nom prenom');
      }
      
      // Obtenir le niveau actuel et suivant
      const niveauActuel = await Niveau.findOne({ niveau: userGamif.niveau.actuel });
      const niveauSuivant = await Niveau.findOne({ niveau: userGamif.niveau.actuel + 1 });
      
      // Calculer le rang global
      const rangGlobal = await UserGamification.countDocuments({
        'points.total': { $gt: userGamif.points.total }
      }) + 1;
      
      res.json({
        success: true,
        data: {
          ...userGamif.toObject(),
          niveauActuel,
          niveauSuivant,
          rangGlobal
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Obtenir le leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const { type = 'global', region, technologie, limit = 50 } = req.query;
      
      const classement = await GamificationService.generateLeaderboard(type, {
        region,
        technologie,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: {
          type,
          classement
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Obtenir les badges disponibles
  getBadges: async (req, res) => {
    try {
      const { categorie } = req.query;
      
      const query = { actif: true };
      if (categorie) query.categorie = categorie;
      
      const badges = await Badge.find(query).sort({ rarete: 1, points: -1 });
      
      res.json({
        success: true,
        data: badges
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Obtenir les défis actifs
  getChallenges: async (req, res) => {
    try {
      const userId = req.user._id;
      const { type } = req.query;
      
      const now = new Date();
      const query = {
        actif: true,
        dateDebut: { $lte: now },
        dateFin: { $gte: now }
      };
      
      if (type) query.type = type;
      
      const challenges = await Challenge.find(query)
        .populate('recompenses.badges');
      
      // Ajouter le progrès de l'utilisateur pour chaque défi
      const challengesWithProgress = await Promise.all(
        challenges.map(async (challenge) => {
          const participant = challenge.participants.find(
            p => p.utilisateur.toString() === userId.toString()
          );
          
          return {
            ...challenge.toObject(),
            userProgress: participant || null
          };
        })
      );
      
      res.json({
        success: true,
        data: challengesWithProgress
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Participer à un défi
  joinChallenge: async (req, res) => {
    try {
      const userId = req.user._id;
      const { challengeId } = req.params;
      
      const challenge = await Challenge.findById(challengeId);
      if (!challenge || !challenge.actif) {
        return res.status(404).json({ error: 'Défi non trouvé ou inactif' });
      }
      
      // Vérifier si l'utilisateur participe déjà
      const alreadyParticipating = challenge.participants.some(
        p => p.utilisateur.toString() === userId.toString()
      );
      
      if (alreadyParticipating) {
        return res.status(400).json({ error: 'Vous participez déjà à ce défi' });
      }
      
      // Ajouter l'utilisateur aux participants
      challenge.participants.push({
        utilisateur: userId,
        progres: challenge.objectifs.map(() => ({ objectif: 0, valeur: 0 }))
      });
      
      await challenge.save();
      
      res.json({
        success: true,
        message: 'Participation au défi enregistrée'
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Mettre à jour les préférences de gamification
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user._id;
      const { preferences } = req.body;
      
      const userGamif = await UserGamification.findOne({ utilisateur: userId });
      if (!userGamif) {
        return res.status(404).json({ error: 'Profil de gamification non trouvé' });
      }
      
      userGamif.preferences = { ...userGamif.preferences, ...preferences };
      await userGamif.save();
      
      res.json({
        success: true,
        data: userGamif.preferences
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = {
  GamificationService,
  gamificationController
};
