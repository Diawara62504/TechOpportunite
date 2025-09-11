const { VideoInterview, QuestionTemplate } = require('../models/videoInterview.model');
const { v4: uuidv4 } = require('uuid');

// Service d'analyse IA pour les entretiens
class InterviewAIService {
  
  // Simuler l'analyse IA d'un entretien
  static async analyzeInterview(interviewId) {
    try {
      const interview = await VideoInterview.findById(interviewId);
      if (!interview || !interview.transcription.texteComplet) {
        throw new Error('Transcription non disponible');
      }
      
      // Simulation d'analyse IA (à remplacer par vraie IA)
      const analyseIA = {
        candidat: {
          scoreGlobal: Math.floor(Math.random() * 40) + 60, // 60-100
          
          competencesTechniques: {
            score: Math.floor(Math.random() * 30) + 70,
            details: [
              {
                competence: 'JavaScript',
                niveau: 'avance',
                confiance: 0.85,
                preuves: ['Mention de React', 'Explication des closures']
              },
              {
                competence: 'Node.js',
                niveau: 'intermediaire',
                confiance: 0.72,
                preuves: ['Discussion sur Express', 'Gestion des middlewares']
              }
            ]
          },
          
          competencesComportementales: {
            communication: {
              score: Math.floor(Math.random() * 20) + 80,
              observations: ['Expression claire', 'Bonne articulation']
            },
            leadership: {
              score: Math.floor(Math.random() * 30) + 60,
              observations: ['Prise d\'initiative mentionnée', 'Expérience de mentorat']
            },
            travailEquipe: {
              score: Math.floor(Math.random() * 25) + 75,
              observations: ['Collaboration active', 'Esprit d\'équipe']
            },
            adaptabilite: {
              score: Math.floor(Math.random() * 30) + 70,
              observations: ['Flexibilité démontrée', 'Apprentissage rapide']
            },
            resolutionProblemes: {
              score: Math.floor(Math.random() * 25) + 75,
              observations: ['Approche structurée', 'Pensée analytique']
            }
          },
          
          analyseSentiment: {
            scoreConfiance: Math.floor(Math.random() * 20) + 70,
            scoreStress: Math.floor(Math.random() * 40) + 20,
            scoreEnthousisme: Math.floor(Math.random() * 30) + 70,
            emotions: [
              { emotion: 'confiance', intensite: 0.8, moment: 300 },
              { emotion: 'nervosité', intensite: 0.3, moment: 120 },
              { emotion: 'enthousiasme', intensite: 0.9, moment: 800 }
            ]
          },
          
          analyseVocale: {
            debitParole: Math.floor(Math.random() * 50) + 120,
            pausesFrequentes: Math.random() > 0.7,
            clarteDiction: Math.random() * 0.3 + 0.7,
            variationTonale: Math.random() * 0.4 + 0.6
          },
          
          pointsForts: [
            'Excellente maîtrise technique',
            'Communication claire et structurée',
            'Motivation évidente pour le poste'
          ],
          pointsAmelioration: [
            'Pourrait développer l\'expérience en leadership',
            'Approfondir les connaissances en architecture'
          ],
          recommandations: [
            'Candidat prometteur avec un bon potentiel',
            'Recommandé pour un poste de niveau intermédiaire à senior'
          ]
        },
        
        entretien: {
          qualiteQuestions: {
            score: Math.floor(Math.random() * 20) + 80,
            feedback: 'Questions pertinentes et bien structurées'
          },
          equilibreConversation: {
            tempsParoleCandidat: Math.floor(Math.random() * 20) + 60,
            tempsParoleRecruteur: Math.floor(Math.random() * 20) + 30,
            nombreInterruptions: Math.floor(Math.random() * 5)
          },
          couvertureCompetences: [
            { competence: 'JavaScript', couverte: true, profondeur: 'approfondie' },
            { competence: 'React', couverte: true, profondeur: 'adequate' },
            { competence: 'Node.js', couverte: true, profondeur: 'superficielle' }
          ],
          suggestionsAmelioration: [
            'Approfondir les questions sur l\'architecture',
            'Explorer davantage l\'expérience en équipe'
          ]
        },
        
        predictions: {
          probabiliteReussite: Math.floor(Math.random() * 30) + 70,
          adequationPoste: Math.floor(Math.random() * 25) + 75,
          potentielEvolution: ['moyen', 'eleve', 'tres_eleve'][Math.floor(Math.random() * 3)],
          risqueAttrition: ['faible', 'moyen'][Math.floor(Math.random() * 2)]
        },
        
        dateAnalyse: new Date(),
        versionModele: '1.0'
      };
      
      // Mettre à jour l'entretien avec l'analyse
      await VideoInterview.findByIdAndUpdate(interviewId, {
        analyseIA
      });
      
      return analyseIA;
      
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      throw error;
    }
  }
  
  // Générer des questions IA basées sur le profil
  static async generateQuestions(domaine, niveau, nombreQuestions = 5) {
    // Simulation de génération de questions IA
    const questionsBase = {
      developpement_web: {
        junior: [
          'Expliquez la différence entre let, const et var en JavaScript',
          'Comment fonctionne le DOM et comment le manipuler ?',
          'Qu\'est-ce que le responsive design ?'
        ],
        intermediaire: [
          'Expliquez les concepts de closure et hoisting en JavaScript',
          'Comment optimisez-vous les performances d\'une application web ?',
          'Décrivez votre approche pour gérer l\'état dans une application React'
        ],
        senior: [
          'Comment concevez-vous une architecture microservices ?',
          'Expliquez votre stratégie de déploiement et CI/CD',
          'Comment gérez-vous la scalabilité d\'une application ?'
        ]
      }
    };
    
    const questions = questionsBase[domaine]?.[niveau] || [];
    
    return questions.slice(0, nombreQuestions).map(question => ({
      question,
      contexte: `Question générée pour ${domaine} niveau ${niveau}`,
      difficulte: niveau === 'junior' ? 'facile' : niveau === 'senior' ? 'difficile' : 'moyen',
      competence: domaine,
      raisonnement: 'Question sélectionnée par IA basée sur le profil',
      dateGeneration: new Date()
    }));
  }
}

// Contrôleur principal des vidéo-entretiens
class VideoInterviewController {
  
  // Créer un nouvel entretien
  static async createInterview(req, res) {
    try {
      const {
        candidatId,
        offre,
        titre,
        description,
        dateHeure,
        dureeEstimee,
        questionsPreparees
      } = req.body;
      
      const recruteurId = req.user.id;
      
      // Générer un ID unique pour la salle
      const salleId = uuidv4();
      const baseUrl = process.env.VIDEO_PLATFORM_URL || 'https://meet.techopportunites.com';
      
      const interview = new VideoInterview({
        candidat: candidatId,
        recruteur: recruteurId,
        offre,
        titre,
        description,
        dateHeure: new Date(dateHeure),
        dureeEstimee,
        fuseauHoraire: {
          candidat: req.body.fuseauHoraireCandidat || 'UTC',
          recruteur: req.body.fuseauHoraireRecruteur || 'UTC'
        },
        salle: {
          id: salleId,
          lienCandidant: `${baseUrl}/room/${salleId}?role=candidate`,
          lienRecruteur: `${baseUrl}/room/${salleId}?role=recruiter`,
          motDePasse: Math.random().toString(36).substring(2, 8).toUpperCase(),
          parametres: {
            enregistrement: true,
            transcription: true,
            analyseSentiment: true,
            detectionEmotions: false
          }
        },
        questionsPreparees: questionsPreparees || []
      });
      
      await interview.save();
      await interview.populate(['candidat', 'recruteur', 'offre']);
      
      res.status(201).json({
        success: true,
        message: 'Entretien créé avec succès',
        data: interview
      });
      
    } catch (error) {
      console.error('Erreur création entretien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'entretien',
        error: error.message
      });
    }
  }
  
  // Obtenir les entretiens d'un utilisateur
  static async getUserInterviews(req, res) {
    try {
      const userId = req.user.id;
      const { role, statut, page = 1, limit = 10 } = req.query;
      
      let query = {};
      
      if (role === 'candidat') {
        query.candidat = userId;
      } else if (role === 'recruteur') {
        query.recruteur = userId;
      } else {
        query.$or = [{ candidat: userId }, { recruteur: userId }];
      }
      
      if (statut) {
        query.statut = statut;
      }
      
      const skip = (page - 1) * limit;
      
      const interviews = await VideoInterview.find(query)
        .populate('candidat', 'prenom nom email photo')
        .populate('recruteur', 'prenom nom email entreprise')
        .populate('offre', 'titre entreprise')
        .sort({ dateHeure: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await VideoInterview.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: {
          interviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Erreur récupération entretiens:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des entretiens',
        error: error.message
      });
    }
  }
  
  // Obtenir un entretien spécifique
  static async getInterview(req, res) {
    try {
      const { interviewId } = req.params;
      const userId = req.user.id;
      
      const interview = await VideoInterview.findById(interviewId)
        .populate('candidat', 'prenom nom email photo')
        .populate('recruteur', 'prenom nom email entreprise')
        .populate('offre', 'titre entreprise description');
      
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Entretien non trouvé'
        });
      }
      
      // Vérifier l'autorisation
      if (interview.candidat._id.toString() !== userId && 
          interview.recruteur._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      
      res.status(200).json({
        success: true,
        data: interview
      });
      
    } catch (error) {
      console.error('Erreur récupération entretien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'entretien',
        error: error.message
      });
    }
  }
  
  // Démarrer un entretien
  static async startInterview(req, res) {
    try {
      const { interviewId } = req.params;
      const userId = req.user.id;
      
      const interview = await VideoInterview.findById(interviewId);
      
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Entretien non trouvé'
        });
      }
      
      // Vérifier l'autorisation
      if (interview.candidat.toString() !== userId && 
          interview.recruteur.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      
      // Mettre à jour le statut
      interview.statut = 'en_cours';
      interview.session.heureDebut = new Date();
      
      // Ajouter le participant
      const participant = {
        utilisateur: userId,
        heureConnexion: new Date(),
        qualiteConnexion: 'bonne'
      };
      
      interview.session.participantsPresents.push(participant);
      
      await interview.save();
      
      res.status(200).json({
        success: true,
        message: 'Entretien démarré',
        data: {
          salleId: interview.salle.id,
          lien: userId === interview.candidat.toString() ? 
                interview.salle.lienCandidant : 
                interview.salle.lienRecruteur,
          motDePasse: interview.salle.motDePasse
        }
      });
      
    } catch (error) {
      console.error('Erreur démarrage entretien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du démarrage de l\'entretien',
        error: error.message
      });
    }
  }
  
  // Terminer un entretien
  static async endInterview(req, res) {
    try {
      const { interviewId } = req.params;
      const { transcription, enregistrement } = req.body;
      
      const interview = await VideoInterview.findById(interviewId);
      
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Entretien non trouvé'
        });
      }
      
      // Mettre à jour les données de fin
      interview.statut = 'termine';
      interview.session.heureFin = new Date();
      interview.session.dureeReelle = Math.floor(
        (interview.session.heureFin - interview.session.heureDebut) / 60000
      );
      
      // Sauvegarder la transcription
      if (transcription) {
        interview.transcription = {
          active: true,
          langue: transcription.langue || 'fr',
          texteComplet: transcription.texteComplet,
          segments: transcription.segments || [],
          motsClefs: transcription.motsClefs || [],
          resume: transcription.resume
        };
      }
      
      // Sauvegarder l'enregistrement
      if (enregistrement) {
        interview.enregistrement = {
          actif: true,
          fichierVideo: enregistrement.fichierVideo,
          fichierAudio: enregistrement.fichierAudio,
          taille: enregistrement.taille,
          duree: enregistrement.duree,
          qualite: enregistrement.qualite || '720p'
        };
      }
      
      await interview.save();
      
      // Lancer l'analyse IA en arrière-plan
      setTimeout(() => {
        InterviewAIService.analyzeInterview(interviewId);
      }, 2000);
      
      res.status(200).json({
        success: true,
        message: 'Entretien terminé avec succès',
        data: interview
      });
      
    } catch (error) {
      console.error('Erreur fin entretien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la fin de l\'entretien',
        error: error.message
      });
    }
  }
  
  // Obtenir l'analyse IA d'un entretien
  static async getInterviewAnalysis(req, res) {
    try {
      const { interviewId } = req.params;
      const userId = req.user.id;
      
      const interview = await VideoInterview.findById(interviewId);
      
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Entretien non trouvé'
        });
      }
      
      // Vérifier l'autorisation
      if (interview.candidat.toString() !== userId && 
          interview.recruteur.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      
      if (!interview.analyseIA) {
        return res.status(404).json({
          success: false,
          message: 'Analyse non encore disponible'
        });
      }
      
      res.status(200).json({
        success: true,
        data: interview.analyseIA
      });
      
    } catch (error) {
      console.error('Erreur récupération analyse:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'analyse',
        error: error.message
      });
    }
  }
  
  // Générer des questions IA
  static async generateAIQuestions(req, res) {
    try {
      const { domaine, niveau, nombreQuestions } = req.body;
      
      const questions = await InterviewAIService.generateQuestions(
        domaine, 
        niveau, 
        nombreQuestions
      );
      
      res.status(200).json({
        success: true,
        data: questions
      });
      
    } catch (error) {
      console.error('Erreur génération questions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des questions',
        error: error.message
      });
    }
  }
  
  // Soumettre une évaluation
  static async submitEvaluation(req, res) {
    try {
      const { interviewId } = req.params;
      const { evaluation, role } = req.body;
      const userId = req.user.id;
      
      const interview = await VideoInterview.findById(interviewId);
      
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Entretien non trouvé'
        });
      }
      
      // Vérifier l'autorisation et le rôle
      if ((role === 'candidat' && interview.candidat.toString() !== userId) ||
          (role === 'recruteur' && interview.recruteur.toString() !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      
      // Mettre à jour l'évaluation
      if (!interview.evaluations) {
        interview.evaluations = {};
      }
      
      interview.evaluations[role] = evaluation;
      await interview.save();
      
      res.status(200).json({
        success: true,
        message: 'Évaluation soumise avec succès'
      });
      
    } catch (error) {
      console.error('Erreur soumission évaluation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la soumission de l\'évaluation',
        error: error.message
      });
    }
  }
}

module.exports = VideoInterviewController;
