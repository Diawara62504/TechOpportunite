const AIMatchingEngine = require('../utils/aiMatchingEngine');
const AIMatching = require('../models/aiMatching.model');
const User = require('../models/user.model');
const Offer = require('../models/offer.model');

// Obtenir les recommandations IA pour un candidat
const getRecommendationsForCandidate = async (req, res) => {
  try {
    const candidatId = req.user.id;
    const { limit = 10 } = req.query;

    const matches = await AIMatchingEngine.findBestMatchesForCandidate(candidatId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        matches,
        totalFound: matches.length,
        message: `${matches.length} offres recommandées basées sur votre profil`
      }
    });
  } catch (error) {
    console.error('Erreur recommandations candidat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des recommandations'
    });
  }
};

// Obtenir les meilleurs candidats pour une offre (recruteurs)
const getBestCandidatesForOffer = async (req, res) => {
  try {
    const { offreId } = req.params;
    const { limit = 10 } = req.query;

    // Vérifier que l'utilisateur est le propriétaire de l'offre
    const offre = await Offer.findById(offreId);
    if (!offre) {
      return res.status(404).json({
        success: false,
        message: 'Offre non trouvée'
      });
    }

    if (offre.source.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette offre'
      });
    }

    const matches = await AIMatchingEngine.findBestCandidatesForOffer(offreId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        matches,
        totalFound: matches.length,
        offre: {
          id: offre._id,
          titre: offre.titre
        },
        message: `${matches.length} candidats recommandés pour cette offre`
      }
    });
  } catch (error) {
    console.error('Erreur recommandations offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de candidats'
    });
  }
};

// Calculer le score de matching pour un candidat et une offre spécifique
const calculateSpecificMatch = async (req, res) => {
  try {
    const { candidatId, offreId } = req.params;

    // Vérifier les permissions
    if (req.user.role === 'candidat' && req.user.id !== candidatId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (req.user.role === 'recruteur') {
      const offre = await Offer.findById(offreId);
      if (!offre || offre.source.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette offre'
        });
      }
    }

    const matching = await AIMatchingEngine.calculateMatch(candidatId, offreId);
    
    res.json({
      success: true,
      data: matching
    });
  } catch (error) {
    console.error('Erreur calcul matching:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du matching'
    });
  }
};

// Obtenir l'historique des matchings pour un utilisateur
const getMatchingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (req.user.role === 'candidat') {
      query.candidat = userId;
    } else if (req.user.role === 'recruteur') {
      // Pour les recruteurs, on récupère les matchings de leurs offres
      const offres = await Offer.find({ source: userId }).select('_id');
      const offreIds = offres.map(o => o._id);
      query.offre = { $in: offreIds };
    }

    const matchings = await AIMatching.find(query)
      .populate('candidat', 'nom prenom email titre entreprise')
      .populate('offre', 'titre description technologies localisation')
      .sort({ dateCalcul: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AIMatching.countDocuments(query);

    res.json({
      success: true,
      data: {
        matchings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur historique matching:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// Obtenir les statistiques de matching pour un utilisateur
const getMatchingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let stats = {};
    
    if (req.user.role === 'candidat') {
      const matchings = await AIMatching.find({ candidat: userId });
      
      stats = {
        totalMatchings: matchings.length,
        averageScore: matchings.length > 0 ? 
          Math.round(matchings.reduce((sum, m) => sum + m.scoreGlobal, 0) / matchings.length) : 0,
        excellentMatches: matchings.filter(m => m.scoreGlobal >= 80).length,
        goodMatches: matchings.filter(m => m.scoreGlobal >= 60 && m.scoreGlobal < 80).length,
        averageMatches: matchings.filter(m => m.scoreGlobal < 60).length,
        topSkillsNeeded: this.getTopSkillsFromRecommendations(matchings),
        lastCalculated: matchings.length > 0 ? matchings[0].dateCalcul : null
      };
    } else if (req.user.role === 'recruteur') {
      const offres = await Offer.find({ source: userId });
      const offreIds = offres.map(o => o._id);
      const matchings = await AIMatching.find({ offre: { $in: offreIds } });
      
      stats = {
        totalOffres: offres.length,
        totalCandidatesAnalyzed: matchings.length,
        averageMatchScore: matchings.length > 0 ? 
          Math.round(matchings.reduce((sum, m) => sum + m.scoreGlobal, 0) / matchings.length) : 0,
        highQualityMatches: matchings.filter(m => m.scoreGlobal >= 80).length,
        offreStats: offreIds.map(offreId => {
          const offreMatchings = matchings.filter(m => m.offre.toString() === offreId.toString());
          const offre = offres.find(o => o._id.toString() === offreId.toString());
          return {
            offreId,
            titre: offre.titre,
            candidatesAnalyzed: offreMatchings.length,
            bestMatch: offreMatchings.length > 0 ? Math.max(...offreMatchings.map(m => m.scoreGlobal)) : 0
          };
        })
      };
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur stats matching:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Fonction utilitaire pour extraire les compétences les plus demandées
const getTopSkillsFromRecommendations = (matchings) => {
  const skillsCount = {};
  
  matchings.forEach(matching => {
    matching.recommandations.forEach(rec => {
      if (rec.type === 'formation' && rec.description.includes('compétences en')) {
        const skills = rec.description.match(/compétences en ([^pour]+)/);
        if (skills && skills[1]) {
          const skillList = skills[1].split(',').map(s => s.trim());
          skillList.forEach(skill => {
            skillsCount[skill] = (skillsCount[skill] || 0) + 1;
          });
        }
      }
    });
  });
  
  return Object.entries(skillsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));
};

module.exports = {
  getRecommendationsForCandidate,
  getBestCandidatesForOffer,
  calculateSpecificMatch,
  getMatchingHistory,
  getMatchingStats
};
