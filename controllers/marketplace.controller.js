const { TalentProfile, TalentRequest, AIMatch } = require('../models/marketplace.model');
const Inscrits = require('../models/inscrits.model');

// Service de matching IA
class MarketplaceMatchingService {
  
  // Calculer le score de matching entre un talent et une demande
  static async calculateMatchScore(talentProfile, talentRequest) {
    let totalScore = 0;
    let criteres = {};
    
    // 1. Score des compétences (30% du score total)
    const competencesScore = this.calculateSkillsMatch(talentProfile.competences, talentRequest.competencesRequises);
    criteres.competences = competencesScore;
    totalScore += competencesScore.score * 0.3;
    
    // 2. Score de localisation (20% du score total)
    const localisationScore = this.calculateLocationMatch(talentProfile.localisation, talentRequest.localisationPreferee);
    criteres.localisation = localisationScore;
    totalScore += localisationScore.score * 0.2;
    
    // 3. Score du budget (20% du score total)
    const budgetScore = this.calculateBudgetMatch(talentProfile.tarification, talentRequest.budget);
    criteres.budget = budgetScore;
    totalScore += budgetScore.score * 0.2;
    
    // 4. Score de l'expérience (15% du score total)
    const experienceScore = this.calculateExperienceMatch(talentProfile.experience, talentRequest.competencesRequises);
    criteres.experience = experienceScore;
    totalScore += experienceScore.score * 0.15;
    
    // 5. Score des langues (10% du score total)
    const languesScore = this.calculateLanguagesMatch(talentProfile.langues, talentRequest.languesRequises);
    criteres.langues = languesScore;
    totalScore += languesScore.score * 0.1;
    
    // 6. Score de disponibilité (5% du score total)
    const disponibiliteScore = this.calculateAvailabilityMatch(talentProfile.disponibilite, talentRequest.mission);
    criteres.disponibilite = disponibiliteScore;
    totalScore += disponibiliteScore.score * 0.05;
    
    // Générer des recommandations
    const recommandations = this.generateRecommendations(criteres, talentProfile, talentRequest);
    
    return {
      scoreMatch: Math.round(totalScore),
      criteres,
      recommandations
    };
  }
  
  static calculateSkillsMatch(talentSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return { score: 100, details: [] };
    }
    
    let matchedSkills = 0;
    let totalRequiredSkills = requiredSkills.length;
    let details = [];
    
    requiredSkills.forEach(required => {
      const talentSkill = talentSkills.find(skill => 
        skill.nom.toLowerCase() === required.nom.toLowerCase()
      );
      
      if (talentSkill) {
        const niveauScore = this.compareSkillLevels(talentSkill.niveau, required.niveau);
        if (niveauScore >= 0.7) matchedSkills++;
        
        details.push({
          competence: required.nom,
          requis: required.niveau,
          possede: talentSkill.niveau,
          match: niveauScore >= 0.7
        });
      } else {
        details.push({
          competence: required.nom,
          requis: required.niveau,
          possede: 'non_possede',
          match: false
        });
      }
    });
    
    return {
      score: Math.round((matchedSkills / totalRequiredSkills) * 100),
      details
    };
  }
  
  static compareSkillLevels(possessed, required) {
    const levels = { 'debutant': 1, 'intermediaire': 2, 'avance': 3, 'expert': 4 };
    const possessedLevel = levels[possessed] || 0;
    const requiredLevel = levels[required] || 0;
    
    if (possessedLevel >= requiredLevel) return 1;
    if (possessedLevel === requiredLevel - 1) return 0.7;
    return 0.3;
  }
  
  static calculateLocationMatch(talentLocation, preferredLocation) {
    let score = 50; // Score de base
    
    // Bonus pour le travail à distance
    if (preferredLocation.remote && talentLocation.remote !== false) {
      score += 30;
    }
    
    // Bonus pour la même région
    if (preferredLocation.regions && preferredLocation.regions.includes(talentLocation.region)) {
      score += 20;
    }
    
    // Bonus pour le même pays
    if (preferredLocation.pays && preferredLocation.pays.includes(talentLocation.pays)) {
      score += 20;
    }
    
    return {
      score: Math.min(100, score),
      distance: 0, // À calculer avec une API de géolocalisation
      fuseauHoraire: true, // À implémenter
      remote: preferredLocation.remote
    };
  }
  
  static calculateBudgetMatch(talentPricing, requestBudget) {
    if (!requestBudget.montant || !talentPricing) {
      return { score: 50, compatible: true, ecart: 0 };
    }
    
    let talentRate, requestRate;
    
    // Normaliser les taux (convertir tout en horaire pour comparaison)
    if (requestBudget.type === 'horaire') {
      requestRate = requestBudget.montant.max || requestBudget.montant.min;
      talentRate = talentPricing.tauxHoraire?.max || talentPricing.tauxHoraire?.min;
    } else if (requestBudget.type === 'journalier') {
      requestRate = (requestBudget.montant.max || requestBudget.montant.min) / 8;
      talentRate = (talentPricing.tauxJournalier?.max || talentPricing.tauxJournalier?.min) / 8;
    }
    
    if (!talentRate || !requestRate) {
      return { score: 50, compatible: true, ecart: 0 };
    }
    
    const ecart = Math.abs(talentRate - requestRate) / requestRate;
    let score = 100;
    
    if (ecart <= 0.1) score = 100;
    else if (ecart <= 0.2) score = 90;
    else if (ecart <= 0.3) score = 70;
    else if (ecart <= 0.5) score = 50;
    else score = 20;
    
    return {
      score,
      compatible: ecart <= 0.5,
      ecart: Math.round(ecart * 100)
    };
  }
  
  static calculateExperienceMatch(talentExperience, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return { score: 100, anneesRequises: 0, anneesPossedees: 0 };
    }
    
    const totalExperienceYears = talentExperience.reduce((total, exp) => {
      const endDate = exp.dateFin || new Date();
      const years = (endDate - exp.dateDebut) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
    
    const maxRequiredExperience = Math.max(...requiredSkills.map(skill => skill.anneesExperience || 0));
    
    let score = 100;
    if (totalExperienceYears < maxRequiredExperience) {
      score = Math.max(20, (totalExperienceYears / maxRequiredExperience) * 100);
    }
    
    return {
      score: Math.round(score),
      anneesRequises: maxRequiredExperience,
      anneesPossedees: Math.round(totalExperienceYears)
    };
  }
  
  static calculateLanguagesMatch(talentLanguages, requiredLanguages) {
    if (!requiredLanguages || requiredLanguages.length === 0) {
      return { score: 100, details: [] };
    }
    
    let matchedLanguages = 0;
    let details = [];
    
    requiredLanguages.forEach(required => {
      const talentLang = talentLanguages.find(lang => 
        lang.langue.toLowerCase() === required.langue.toLowerCase()
      );
      
      if (talentLang) {
        const levelMatch = this.compareLanguageLevels(talentLang.niveau, required.niveau);
        if (levelMatch >= 0.7) matchedLanguages++;
        
        details.push({
          langue: required.langue,
          requis: required.niveau,
          possede: talentLang.niveau,
          match: levelMatch >= 0.7
        });
      } else {
        details.push({
          langue: required.langue,
          requis: required.niveau,
          possede: 'non_possede',
          match: false
        });
      }
    });
    
    return {
      score: Math.round((matchedLanguages / requiredLanguages.length) * 100),
      details
    };
  }
  
  static compareLanguageLevels(possessed, required) {
    const levels = { 'debutant': 1, 'intermediaire': 2, 'courant': 3, 'natif': 4 };
    const possessedLevel = levels[possessed] || 0;
    const requiredLevel = levels[required] || 0;
    
    if (possessedLevel >= requiredLevel) return 1;
    if (possessedLevel === requiredLevel - 1) return 0.7;
    return 0.3;
  }
  
  static calculateAvailabilityMatch(talentAvailability, missionDetails) {
    let score = 100;
    
    // Vérifier le type de mission
    if (talentAvailability.type !== missionDetails.type) {
      score -= 30;
    }
    
    // Vérifier la date de disponibilité
    const missionStart = new Date(missionDetails.dateDebut);
    const talentAvailable = new Date(talentAvailability.dateDisponibilite);
    
    if (missionStart < talentAvailable) {
      const daysDiff = (talentAvailable - missionStart) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) score -= 40;
      else if (daysDiff > 7) score -= 20;
    }
    
    return {
      score: Math.max(0, score),
      typeMatch: talentAvailability.type === missionDetails.type,
      dateMatch: talentAvailable <= missionStart
    };
  }
  
  static generateRecommendations(criteres, talentProfile, talentRequest) {
    let recommandations = [];
    
    if (criteres.competences.score < 70) {
      recommandations.push({
        type: 'competences',
        message: 'Améliorer les compétences manquantes pour ce type de mission',
        priorite: 'haute'
      });
    }
    
    if (criteres.budget.score < 50) {
      recommandations.push({
        type: 'budget',
        message: 'Ajuster les tarifs pour être plus compétitif',
        priorite: 'moyenne'
      });
    }
    
    if (criteres.langues.score < 80) {
      recommandations.push({
        type: 'langues',
        message: 'Améliorer les compétences linguistiques requises',
        priorite: 'moyenne'
      });
    }
    
    return recommandations;
  }
}

// Contrôleur principal du marketplace
class MarketplaceController {
  
  // Créer ou mettre à jour un profil talent
  static async createOrUpdateTalentProfile(req, res) {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      
      let talentProfile = await TalentProfile.findOne({ utilisateur: userId });
      
      if (talentProfile) {
        // Mise à jour du profil existant
        Object.assign(talentProfile, profileData);
        talentProfile.statistiques.derniereMiseAJour = new Date();
        await talentProfile.save();
      } else {
        // Création d'un nouveau profil
        talentProfile = new TalentProfile({
          utilisateur: userId,
          ...profileData
        });
        await talentProfile.save();
      }
      
      await talentProfile.populate('utilisateur', 'prenom nom email');
      
      res.status(200).json({
        success: true,
        message: 'Profil talent mis à jour avec succès',
        data: talentProfile
      });
      
    } catch (error) {
      console.error('Erreur création/mise à jour profil talent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil',
        error: error.message
      });
    }
  }
  
  // Obtenir le profil talent de l'utilisateur connecté
  static async getMyTalentProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const talentProfile = await TalentProfile.findOne({ utilisateur: userId })
        .populate('utilisateur', 'prenom nom email photo');
      
      if (!talentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profil talent non trouvé'
        });
      }
      
      res.status(200).json({
        success: true,
        data: talentProfile
      });
      
    } catch (error) {
      console.error('Erreur récupération profil talent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: error.message
      });
    }
  }
  
  // Rechercher des talents
  static async searchTalents(req, res) {
    try {
      const {
        competences,
        domaines,
        localisation,
        budget,
        disponibilite,
        langues,
        page = 1,
        limit = 20,
        sortBy = 'evaluations.moyenne'
      } = req.query;
      
      let query = { statut: 'actif', visibilite: 'publique' };
      
      // Filtres de recherche
      if (competences) {
        const competencesList = competences.split(',');
        query['competences.nom'] = { $in: competencesList };
      }
      
      if (domaines) {
        const domainesList = domaines.split(',');
        query.domaines = { $in: domainesList };
      }
      
      if (localisation) {
        const { pays, region, remote } = JSON.parse(localisation);
        if (pays) query['localisation.pays'] = pays;
        if (region) query['localisation.region'] = region;
        if (remote) query['disponibilite.remote'] = true;
      }
      
      if (budget) {
        const { min, max, type } = JSON.parse(budget);
        if (type === 'horaire') {
          query['tarification.tauxHoraire.min'] = { $lte: max };
          query['tarification.tauxHoraire.max'] = { $gte: min };
        }
      }
      
      if (disponibilite) {
        query['disponibilite.type'] = disponibilite;
      }
      
      if (langues) {
        const languesList = langues.split(',');
        query['langues.langue'] = { $in: languesList };
      }
      
      const skip = (page - 1) * limit;
      
      const talents = await TalentProfile.find(query)
        .populate('utilisateur', 'prenom nom photo')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await TalentProfile.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: {
          talents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Erreur recherche talents:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        error: error.message
      });
    }
  }
  
  // Obtenir un profil talent spécifique
  static async getTalentProfile(req, res) {
    try {
      const { talentId } = req.params;
      
      const talentProfile = await TalentProfile.findById(talentId)
        .populate('utilisateur', 'prenom nom email photo');
      
      if (!talentProfile || talentProfile.visibilite === 'privee') {
        return res.status(404).json({
          success: false,
          message: 'Profil talent non trouvé'
        });
      }
      
      // Incrémenter le compteur de vues
      talentProfile.statistiques.vuesProfile += 1;
      await talentProfile.save();
      
      res.status(200).json({
        success: true,
        data: talentProfile
      });
      
    } catch (error) {
      console.error('Erreur récupération profil talent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: error.message
      });
    }
  }
  
  // Créer une demande de talent
  static async createTalentRequest(req, res) {
    try {
      const userId = req.user.id;
      const requestData = req.body;
      
      const talentRequest = new TalentRequest({
        recruteur: userId,
        ...requestData
      });
      
      await talentRequest.save();
      
      // Lancer le processus de matching IA en arrière-plan
      setTimeout(() => {
        MarketplaceController.generateMatches(talentRequest._id);
      }, 1000);
      
      res.status(201).json({
        success: true,
        message: 'Demande de talent créée avec succès',
        data: talentRequest
      });
      
    } catch (error) {
      console.error('Erreur création demande talent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande',
        error: error.message
      });
    }
  }
  
  // Générer des matches IA pour une demande
  static async generateMatches(requestId) {
    try {
      const talentRequest = await TalentRequest.findById(requestId);
      if (!talentRequest) return;
      
      // Rechercher les talents compatibles
      let query = { statut: 'actif', visibilite: 'publique' };
      
      // Filtrer par domaines
      if (talentRequest.domaines.length > 0) {
        query.domaines = { $in: talentRequest.domaines };
      }
      
      // Filtrer par localisation
      if (talentRequest.localisationPreferee.regions.length > 0) {
        query['localisation.region'] = { $in: talentRequest.localisationPreferee.regions };
      }
      
      const potentialTalents = await TalentProfile.find(query).limit(50);
      
      // Calculer les scores de matching
      for (const talent of potentialTalents) {
        try {
          const matchResult = await MarketplaceMatchingService.calculateMatchScore(talent, talentRequest);
          
          // Ne sauvegarder que les matches avec un score > 30
          if (matchResult.scoreMatch > 30) {
            const existingMatch = await AIMatch.findOne({
              talent: talent._id,
              demande: requestId
            });
            
            if (!existingMatch) {
              const aiMatch = new AIMatch({
                talent: talent._id,
                demande: requestId,
                scoreMatch: matchResult.scoreMatch,
                criteres: matchResult.criteres,
                recommandations: matchResult.recommandations
              });
              
              await aiMatch.save();
            }
          }
        } catch (matchError) {
          console.error('Erreur calcul match:', matchError);
        }
      }
      
      // Mettre à jour le compteur de matches
      const matchCount = await AIMatch.countDocuments({ demande: requestId });
      await TalentRequest.findByIdAndUpdate(requestId, {
        'metriques.matchsIA': matchCount
      });
      
    } catch (error) {
      console.error('Erreur génération matches:', error);
    }
  }
  
  // Obtenir les matches pour une demande
  static async getMatchesForRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Vérifier que l'utilisateur est propriétaire de la demande
      const talentRequest = await TalentRequest.findById(requestId);
      if (!talentRequest || talentRequest.recruteur.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      
      const skip = (page - 1) * limit;
      
      const matches = await AIMatch.find({ demande: requestId })
        .populate({
          path: 'talent',
          populate: {
            path: 'utilisateur',
            select: 'prenom nom photo'
          }
        })
        .sort({ scoreMatch: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await AIMatch.countDocuments({ demande: requestId });
      
      res.status(200).json({
        success: true,
        data: {
          matches,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Erreur récupération matches:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des matches',
        error: error.message
      });
    }
  }
  
  // Obtenir les matches pour un talent
  static async getMatchesForTalent(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const talentProfile = await TalentProfile.findOne({ utilisateur: userId });
      if (!talentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profil talent non trouvé'
        });
      }
      
      const skip = (page - 1) * limit;
      
      const matches = await AIMatch.find({ talent: talentProfile._id })
        .populate({
          path: 'demande',
          populate: {
            path: 'recruteur',
            select: 'prenom nom entreprise'
          }
        })
        .sort({ scoreMatch: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await AIMatch.countDocuments({ talent: talentProfile._id });
      
      res.status(200).json({
        success: true,
        data: {
          matches,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Erreur récupération matches talent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des matches',
        error: error.message
      });
    }
  }
  
  // Marquer un match comme vu/intéressé
  static async updateMatchStatus(req, res) {
    try {
      const { matchId } = req.params;
      const { statut, acteur } = req.body;
      
      const match = await AIMatch.findById(matchId);
      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match non trouvé'
        });
      }
      
      // Mettre à jour le statut
      match.statut = statut;
      
      // Ajouter l'interaction
      match.interactions.push({
        acteur,
        action: statut,
        date: new Date()
      });
      
      await match.save();
      
      res.status(200).json({
        success: true,
        message: 'Statut du match mis à jour',
        data: match
      });
      
    } catch (error) {
      console.error('Erreur mise à jour match:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour',
        error: error.message
      });
    }
  }
  
  // Obtenir les statistiques du marketplace
  static async getMarketplaceStats(req, res) {
    try {
      const stats = await Promise.all([
        TalentProfile.countDocuments({ statut: 'actif' }),
        TalentRequest.countDocuments({ statut: 'active' }),
        AIMatch.countDocuments({ scoreMatch: { $gte: 70 } }),
        TalentProfile.aggregate([
          { $group: { _id: '$localisation.region', count: { $sum: 1 } } }
        ]),
        TalentProfile.aggregate([
          { $unwind: '$domaines' },
          { $group: { _id: '$domaines', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          totalTalents: stats[0],
          activeRequests: stats[1],
          qualityMatches: stats[2],
          talentsByRegion: stats[3],
          topDomains: stats[4]
        }
      });
      
    } catch (error) {
      console.error('Erreur statistiques marketplace:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = MarketplaceController;
