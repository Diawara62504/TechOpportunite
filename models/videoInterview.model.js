const mongoose = require('mongoose');

// Schéma pour les sessions de vidéo-entretiens
const videoInterviewSchema = new mongoose.Schema({
  // Participants
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: true
  },
  
  recruteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: true
  },
  
  // Informations de l'entretien
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offres',
    required: false
  },
  
  titre: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Planification
  dateHeure: {
    type: Date,
    required: true
  },
  
  dureeEstimee: {
    type: Number, // en minutes
    default: 60,
    min: 15,
    max: 180
  },
  
  fuseauHoraire: {
    candidat: {
      type: String,
      required: true
    },
    recruteur: {
      type: String,
      required: true
    }
  },
  
  // Configuration technique
  salle: {
    id: {
      type: String,
      required: true
    },
    lienCandidant: {
      type: String,
      required: true
    },
    lienRecruteur: {
      type: String,
      required: true
    },
    motDePasse: String,
    parametres: {
      enregistrement: {
        type: Boolean,
        default: true
      },
      transcription: {
        type: Boolean,
        default: true
      },
      analyseSentiment: {
        type: Boolean,
        default: true
      },
      detectionEmotions: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Questions préparées
  questionsPreparees: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['technique', 'comportementale', 'situationnelle', 'generale'],
      required: true
    },
    difficulte: {
      type: String,
      enum: ['facile', 'moyen', 'difficile'],
      default: 'moyen'
    },
    tempsEstime: {
      type: Number, // en minutes
      default: 5
    },
    competenceEvaluee: String,
    reponseAttendue: String,
    criteresEvaluation: [String]
  }],
  
  // Questions générées par IA
  questionsIA: [{
    question: String,
    contexte: String,
    difficulte: String,
    competence: String,
    raisonnement: String,
    dateGeneration: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statut et suivi
  statut: {
    type: String,
    enum: ['planifie', 'en_cours', 'termine', 'annule', 'reporte'],
    default: 'planifie'
  },
  
  // Données de session
  session: {
    heureDebut: Date,
    heureFin: Date,
    dureeReelle: Number, // en minutes
    participantsPresents: [{
      utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscrits'
      },
      heureConnexion: Date,
      heureDeconnexion: Date,
      qualiteConnexion: {
        type: String,
        enum: ['excellente', 'bonne', 'moyenne', 'faible']
      }
    }],
    problemesTechniques: [{
      type: String,
      description: String,
      heure: Date,
      resolu: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Enregistrement et transcription
  enregistrement: {
    actif: {
      type: Boolean,
      default: true
    },
    fichierVideo: String,
    fichierAudio: String,
    taille: Number, // en MB
    duree: Number, // en secondes
    qualite: {
      type: String,
      enum: ['720p', '1080p', '4k'],
      default: '720p'
    }
  },
  
  transcription: {
    active: {
      type: Boolean,
      default: true
    },
    langue: {
      type: String,
      default: 'fr'
    },
    texteComplet: String,
    segments: [{
      locuteur: {
        type: String,
        enum: ['candidat', 'recruteur']
      },
      texte: String,
      horodatage: {
        debut: Number, // en secondes
        fin: Number
      },
      confiance: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    motsClefs: [String],
    resume: String
  },
  
  // Analyse IA
  analyseIA: {
    // Analyse du candidat
    candidat: {
      scoreGlobal: {
        type: Number,
        min: 0,
        max: 100
      },
      
      competencesTechniques: {
        score: Number,
        details: [{
          competence: String,
          niveau: {
            type: String,
            enum: ['debutant', 'intermediaire', 'avance', 'expert']
          },
          confiance: Number,
          preuves: [String]
        }]
      },
      
      competencesComportementales: {
        communication: {
          score: Number,
          observations: [String]
        },
        leadership: {
          score: Number,
          observations: [String]
        },
        travailEquipe: {
          score: Number,
          observations: [String]
        },
        adaptabilite: {
          score: Number,
          observations: [String]
        },
        resolutionProblemes: {
          score: Number,
          observations: [String]
        }
      },
      
      analyseSentiment: {
        scoreConfiance: Number,
        scoreStress: Number,
        scoreEnthousisme: Number,
        emotions: [{
          emotion: String,
          intensite: Number,
          moment: Number // timestamp en secondes
        }]
      },
      
      analyseVocale: {
        debitParole: Number, // mots par minute
        pausesFrequentes: Boolean,
        clarteDiction: Number,
        variationTonale: Number
      },
      
      pointsForts: [String],
      pointsAmelioration: [String],
      recommandations: [String]
    },
    
    // Analyse de l'entretien
    entretien: {
      qualiteQuestions: {
        score: Number,
        feedback: String
      },
      equilibreConversation: {
        tempsParoleCandidat: Number, // en pourcentage
        tempsParoleRecruteur: Number,
        nombreInterruptions: Number
      },
      couvertureCompetences: [{
        competence: String,
        couverte: Boolean,
        profondeur: {
          type: String,
          enum: ['superficielle', 'adequate', 'approfondie']
        }
      }],
      suggestionsAmelioration: [String]
    },
    
    // Prédictions
    predictions: {
      probabiliteReussite: {
        type: Number,
        min: 0,
        max: 100
      },
      adequationPoste: {
        type: Number,
        min: 0,
        max: 100
      },
      potentielEvolution: {
        type: String,
        enum: ['faible', 'moyen', 'eleve', 'tres_eleve']
      },
      risqueAttrition: {
        type: String,
        enum: ['faible', 'moyen', 'eleve']
      }
    },
    
    dateAnalyse: {
      type: Date,
      default: Date.now
    },
    
    versionModele: {
      type: String,
      default: '1.0'
    }
  },
  
  // Évaluations manuelles
  evaluations: {
    recruteur: {
      scoreGlobal: {
        type: Number,
        min: 0,
        max: 10
      },
      competencesTechniques: {
        type: Number,
        min: 0,
        max: 10
      },
      competencesComportementales: {
        type: Number,
        min: 0,
        max: 10
      },
      adequationCulture: {
        type: Number,
        min: 0,
        max: 10
      },
      commentaires: String,
      recommandation: {
        type: String,
        enum: ['rejeter', 'revoir', 'accepter', 'fortement_recommande']
      },
      prochainEtapes: String
    },
    
    candidat: {
      satisfactionEntretien: {
        type: Number,
        min: 1,
        max: 5
      },
      qualiteQuestions: {
        type: Number,
        min: 1,
        max: 5
      },
      professionnalismeRecruteur: {
        type: Number,
        min: 1,
        max: 5
      },
      interessePoste: {
        type: Number,
        min: 1,
        max: 5
      },
      commentaires: String
    }
  },
  
  // Suivi post-entretien
  suivi: {
    feedbackEnvoye: {
      candidat: {
        type: Boolean,
        default: false
      },
      recruteur: {
        type: Boolean,
        default: false
      }
    },
    
    prochainEtapes: [{
      etape: String,
      datePrevu: Date,
      statut: {
        type: String,
        enum: ['planifie', 'en_cours', 'termine', 'annule'],
        default: 'planifie'
      },
      responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscrits'
      }
    }],
    
    decision: {
      type: String,
      enum: ['en_attente', 'accepte', 'refuse', 'en_reserve'],
      default: 'en_attente'
    },
    
    dateDecision: Date,
    raisonDecision: String
  },
  
  // Métadonnées
  metadata: {
    navigateurCandidat: String,
    navigateurRecruteur: String,
    qualiteReseauCandidat: String,
    qualiteReseauRecruteur: String,
    appareilCandidat: String,
    appareilRecruteur: String,
    versionPlateforme: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les requêtes fréquentes
videoInterviewSchema.index({ candidat: 1, dateHeure: -1 });
videoInterviewSchema.index({ recruteur: 1, dateHeure: -1 });
videoInterviewSchema.index({ statut: 1, dateHeure: 1 });
videoInterviewSchema.index({ 'salle.id': 1 }, { unique: true });
videoInterviewSchema.index({ offre: 1, statut: 1 });

// Schéma pour les templates de questions
const questionTemplateSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  
  description: String,
  
  domaine: {
    type: String,
    enum: [
      'developpement_web', 'developpement_mobile', 'data_science', 'ia_ml',
      'cybersecurite', 'devops', 'cloud', 'blockchain', 'design_ui_ux',
      'product_management', 'general'
    ],
    required: true
  },
  
  niveau: {
    type: String,
    enum: ['junior', 'intermediaire', 'senior', 'expert'],
    required: true
  },
  
  questions: [{
    texte: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['technique', 'comportementale', 'situationnelle', 'generale'],
      required: true
    },
    difficulte: {
      type: String,
      enum: ['facile', 'moyen', 'difficile'],
      required: true
    },
    tempsEstime: Number,
    competenceEvaluee: String,
    criteresEvaluation: [String],
    reponseType: String,
    exemplesReponses: [String]
  }],
  
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: true
  },
  
  utilisation: {
    nombreUtilisations: {
      type: Number,
      default: 0
    },
    notesMoyennes: {
      type: Number,
      default: 0
    },
    commentaires: [{
      utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscrits'
      },
      note: {
        type: Number,
        min: 1,
        max: 5
      },
      commentaire: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  statut: {
    type: String,
    enum: ['brouillon', 'actif', 'archive'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// Index pour les templates
questionTemplateSchema.index({ domaine: 1, niveau: 1 });
questionTemplateSchema.index({ statut: 1, 'utilisation.notesMoyennes': -1 });

const VideoInterview = mongoose.model('VideoInterview', videoInterviewSchema);
const QuestionTemplate = mongoose.model('QuestionTemplate', questionTemplateSchema);

module.exports = {
  VideoInterview,
  QuestionTemplate
};
