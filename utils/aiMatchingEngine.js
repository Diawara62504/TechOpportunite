const User = require('../models/user.model');
const Offer = require('../models/offer.model');
const AIMatching = require('../models/aiMatching.model');

class AIMatchingEngine {
  // Algorithme principal de matching IA
  static async calculateMatch(candidatId, offreId) {
    try {
      const candidat = await User.findById(candidatId);
      const offre = await Offer.findById(offreId).populate('source');
      
      if (!candidat || !offre) {
        throw new Error('Candidat ou offre non trouvé');
      }

      const scores = {
        competencesTechniques: this.calculateTechSkillsMatch(candidat, offre),
        experience: this.calculateExperienceMatch(candidat, offre),
        localisation: this.calculateLocationMatch(candidat, offre),
        salaire: this.calculateSalaryMatch(candidat, offre),
        culturel: this.calculateCulturalMatch(candidat, offre)
      };

      // Score global pondéré
      const scoreGlobal = Math.round(
        scores.competencesTechniques * 0.35 +
        scores.experience * 0.25 +
        scores.localisation * 0.15 +
        scores.salaire * 0.15 +
        scores.culturel * 0.10
      );

      const recommandations = this.generateRecommendations(candidat, offre, scores);

      // Sauvegarder ou mettre à jour le matching
      const matching = await AIMatching.findOneAndUpdate(
        { candidat: candidatId, offre: offreId },
        {
          scoreGlobal,
          scores,
          recommandations,
          dateCalcul: new Date(),
          statut: 'actif'
        },
        { upsert: true, new: true }
      );

      return matching;
    } catch (error) {
      console.error('Erreur calcul matching IA:', error);
      throw error;
    }
  }

  // Calcul du match des compétences techniques
  static calculateTechSkillsMatch(candidat, offre) {
    const candidatSkills = candidat.competences || [];
    const requiredTechs = offre.technologies ? offre.technologies.split(',').map(t => t.trim().toLowerCase()) : [];
    
    if (requiredTechs.length === 0) return 50;

    let matchCount = 0;
    requiredTechs.forEach(tech => {
      if (candidatSkills.some(skill => skill.toLowerCase().includes(tech))) {
        matchCount++;
      }
    });

    return Math.min(100, Math.round((matchCount / requiredTechs.length) * 100));
  }

  // Calcul du match d'expérience
  static calculateExperienceMatch(candidat, offre) {
    const experiences = candidat.experience || [];
    const totalExperience = experiences.reduce((total, exp) => {
      const startDate = new Date(exp.dateDebut);
      const endDate = exp.dateFin ? new Date(exp.dateFin) : new Date();
      const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    // Analyse du titre de l'offre pour déterminer le niveau requis
    const titre = offre.titre.toLowerCase();
    let requiredYears = 0;
    
    if (titre.includes('junior') || titre.includes('débutant')) requiredYears = 1;
    else if (titre.includes('senior') || titre.includes('expert')) requiredYears = 5;
    else if (titre.includes('lead') || titre.includes('architect')) requiredYears = 8;
    else requiredYears = 3; // Par défaut

    if (totalExperience >= requiredYears) {
      return Math.min(100, Math.round((totalExperience / requiredYears) * 80));
    } else {
      return Math.round((totalExperience / requiredYears) * 60);
    }
  }

  // Calcul du match de localisation
  static calculateLocationMatch(candidat, offre) {
    const candidatLocation = candidat.localisation?.toLowerCase() || '';
    const offreLocation = offre.localisation?.toLowerCase() || '';
    
    if (!candidatLocation || !offreLocation) return 50;
    
    // Match exact
    if (candidatLocation === offreLocation) return 100;
    
    // Match partiel (même ville ou région)
    if (candidatLocation.includes(offreLocation) || offreLocation.includes(candidatLocation)) {
      return 80;
    }
    
    // Remote work bonus
    if (offreLocation.includes('remote') || offreLocation.includes('télétravail')) {
      return 90;
    }
    
    return 30;
  }

  // Calcul du match salarial (estimation basée sur l'expérience)
  static calculateSalaryMatch(candidat, offre) {
    // Estimation basée sur l'expérience et les compétences
    const experiences = candidat.experience || [];
    const totalExperience = experiences.reduce((total, exp) => {
      const startDate = new Date(exp.dateDebut);
      const endDate = exp.dateFin ? new Date(exp.dateFin) : new Date();
      const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    // Estimation du salaire souhaité basé sur l'expérience
    const estimatedSalary = 35000 + (totalExperience * 8000);
    
    // Pour l'instant, on retourne un score moyen car on n'a pas le salaire dans l'offre
    return 75;
  }

  // Calcul du match culturel
  static calculateCulturalMatch(candidat, offre) {
    let score = 50; // Score de base
    
    // Bonus pour les langues
    const langues = candidat.langues || [];
    if (langues.some(l => l.langue.toLowerCase().includes('anglais'))) {
      score += 20;
    }
    if (langues.some(l => l.langue.toLowerCase().includes('français'))) {
      score += 15;
    }
    
    // Bonus pour les profils internationaux
    if (candidat.linkedin || candidat.github || candidat.portfolio) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  // Génération de recommandations personnalisées
  static generateRecommendations(candidat, offre, scores) {
    const recommandations = [];
    
    if (scores.competencesTechniques < 70) {
      const requiredTechs = offre.technologies ? offre.technologies.split(',').map(t => t.trim()) : [];
      recommandations.push({
        type: 'formation',
        description: `Améliorer vos compétences en ${requiredTechs.slice(0, 2).join(', ')} pour mieux correspondre à cette offre`,
        priorite: 'haute'
      });
    }
    
    if (scores.experience < 60) {
      recommandations.push({
        type: 'experience',
        description: 'Considérez des projets personnels ou du bénévolat pour enrichir votre expérience',
        priorite: 'moyenne'
      });
    }
    
    if (!candidat.github && scores.competencesTechniques > 70) {
      recommandations.push({
        type: 'certification',
        description: 'Créez un profil GitHub pour showcaser vos projets techniques',
        priorite: 'moyenne'
      });
    }
    
    return recommandations;
  }

  // Trouver les meilleurs matchs pour un candidat
  static async findBestMatchesForCandidate(candidatId, limit = 10) {
    try {
      const offres = await Offer.find({ 
        candidatures: { $not: { $elemMatch: { candidat: candidatId } } }
      }).populate('source');
      
      const matches = [];
      
      for (const offre of offres) {
        const matching = await this.calculateMatch(candidatId, offre._id);
        matches.push({
          offre,
          matching
        });
      }
      
      return matches
        .sort((a, b) => b.matching.scoreGlobal - a.matching.scoreGlobal)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur recherche meilleurs matchs:', error);
      throw error;
    }
  }

  // Trouver les meilleurs candidats pour une offre
  static async findBestCandidatesForOffer(offreId, limit = 10) {
    try {
      const offre = await Offer.findById(offreId);
      if (!offre) throw new Error('Offre non trouvée');
      
      const candidats = await User.find({ 
        role: 'candidat',
        _id: { $not: { $in: offre.candidatures.map(c => c.candidat) } }
      });
      
      const matches = [];
      
      for (const candidat of candidats) {
        const matching = await this.calculateMatch(candidat._id, offreId);
        matches.push({
          candidat,
          matching
        });
      }
      
      return matches
        .sort((a, b) => b.matching.scoreGlobal - a.matching.scoreGlobal)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur recherche meilleurs candidats:', error);
      throw error;
    }
  }
}

module.exports = AIMatchingEngine;
