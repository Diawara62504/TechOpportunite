const mongoose = require('mongoose');

// Schéma pour les profils talents sur le marketplace
const talentProfileSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: true,
    unique: true
  },
  
  // Informations de base
  titre: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Localisation et disponibilité
  localisation: {
    pays: {
      type: String,
      required: true
    },
    ville: {
      type: String,
      required: true
    },
    region: {
      type: String,
      enum: ['Afrique_Ouest', 'Afrique_Est', 'Afrique_Nord', 'Afrique_Centrale', 'Afrique_Sud', 'International']
    },
    fuseauHoraire: {
      type: String,
      required: true
    },
    coordonnees: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Compétences et expertise
  competences: [{
    nom: {
      type: String,
      required: true
    },
    niveau: {
      type: String,
      enum: ['debutant', 'intermediaire', 'avance', 'expert'],
      required: true
    },
    anneesExperience: {
      type: Number,
      min: 0,
      max: 50
    },
    certifie: {
      type: Boolean,
      default: false
    }
  }],
  
  // Domaines d'expertise
  domaines: [{
    type: String,
    enum: [
      'developpement_web', 'developpement_mobile', 'data_science', 'ia_ml',
      'cybersecurite', 'devops', 'cloud', 'blockchain', 'iot', 'fintech',
      'edtech', 'healthtech', 'agritech', 'cleantech', 'e_commerce',
      'design_ui_ux', 'product_management', 'consulting', 'formation'
    ]
  }],
  
  // Langues parlées
  langues: [{
    langue: {
      type: String,
      required: true
    },
    niveau: {
      type: String,
      enum: ['debutant', 'intermediaire', 'courant', 'natif'],
      required: true
    }
  }],
  
  // Tarification et disponibilité
  tarification: {
    tauxHoraire: {
      min: Number,
      max: Number,
      devise: {
        type: String,
        default: 'USD'
      }
    },
    tauxJournalier: {
      min: Number,
      max: Number,
      devise: {
        type: String,
        default: 'USD'
      }
    },
    tauxProjet: {
      min: Number,
      max: Number,
      devise: {
        type: String,
        default: 'USD'
      }
    },
    negociable: {
      type: Boolean,
      default: true
    }
  },
  
  disponibilite: {
    type: {
      type: String,
      enum: ['temps_plein', 'temps_partiel', 'freelance', 'contrat', 'stage'],
      required: true
    },
    heuresParSemaine: {
      type: Number,
      min: 1,
      max: 60
    },
    dateDisponibilite: {
      type: Date,
      default: Date.now
    },
    remote: {
      type: Boolean,
      default: true
    },
    voyage: {
      type: Boolean,
      default: false
    }
  },
  
  // Portfolio et réalisations
  portfolio: [{
    titre: {
      type: String,
      required: true
    },
    description: String,
    technologies: [String],
    lienDemo: String,
    lienCode: String,
    images: [String],
    dateRealisation: Date,
    client: String,
    impact: String
  }],
  
  // Expérience professionnelle
  experience: [{
    entreprise: {
      type: String,
      required: true
    },
    poste: {
      type: String,
      required: true
    },
    dateDebut: {
      type: Date,
      required: true
    },
    dateFin: Date,
    enCours: {
      type: Boolean,
      default: false
    },
    description: String,
    technologies: [String],
    realisations: [String]
  }],
  
  // Formation et certifications
  formation: [{
    etablissement: String,
    diplome: String,
    domaine: String,
    dateObtention: Date,
    mention: String
  }],
  
  certifications: [{
    nom: {
      type: String,
      required: true
    },
    organisme: String,
    dateObtention: Date,
    dateExpiration: Date,
    lienVerification: String,
    score: Number
  }],
  
  // Évaluations et témoignages
  evaluations: {
    moyenne: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    },
    repartition: {
      cinq: { type: Number, default: 0 },
      quatre: { type: Number, default: 0 },
      trois: { type: Number, default: 0 },
      deux: { type: Number, default: 0 },
      un: { type: Number, default: 0 }
    }
  },
  
  temoignages: [{
    client: {
      nom: String,
      entreprise: String,
      poste: String
    },
    note: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    commentaire: {
      type: String,
      required: true,
      maxlength: 1000
    },
    projet: String,
    date: {
      type: Date,
      default: Date.now
    },
    verifie: {
      type: Boolean,
      default: false
    }
  }],
  
  // Statistiques et métriques
  statistiques: {
    vuesProfile: {
      type: Number,
      default: 0
    },
    projetsCompletes: {
      type: Number,
      default: 0
    },
    tauxReussite: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    tempsReponse: {
      type: Number, // en heures
      default: 24
    },
    derniereMiseAJour: {
      type: Date,
      default: Date.now
    }
  },
  
  // Visibilité et statut
  statut: {
    type: String,
    enum: ['actif', 'inactif', 'suspendu', 'premium'],
    default: 'actif'
  },
  
  visibilite: {
    type: String,
    enum: ['publique', 'privee', 'limitee'],
    default: 'publique'
  },
  
  premium: {
    actif: {
      type: Boolean,
      default: false
    },
    dateExpiration: Date,
    fonctionnalites: [String]
  },
  
  // Préférences de matching
  preferences: {
    typesMission: [{
      type: String,
      enum: ['court_terme', 'long_terme', 'ponctuel', 'recurrent']
    }],
    secteurs: [String],
    tailleEntreprise: [{
      type: String,
      enum: ['startup', 'pme', 'grande_entreprise', 'ong', 'gouvernement']
    }],
    budgetMinimum: Number,
    notificationsEmail: {
      type: Boolean,
      default: true
    },
    notificationsSMS: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches
talentProfileSchema.index({ 'localisation.pays': 1, 'localisation.region': 1 });
talentProfileSchema.index({ 'competences.nom': 1, 'competences.niveau': 1 });
talentProfileSchema.index({ domaines: 1 });
talentProfileSchema.index({ 'tarification.tauxHoraire.min': 1, 'tarification.tauxHoraire.max': 1 });
talentProfileSchema.index({ 'disponibilite.type': 1, 'disponibilite.remote': 1 });
talentProfileSchema.index({ 'evaluations.moyenne': -1, 'evaluations.total': -1 });
talentProfileSchema.index({ statut: 1, visibilite: 1 });

// Schéma pour les demandes de talents (côté recruteur/entreprise)
const talentRequestSchema = new mongoose.Schema({
  recruteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: true
  },
  
  entreprise: {
    nom: {
      type: String,
      required: true
    },
    secteur: String,
    taille: {
      type: String,
      enum: ['startup', 'pme', 'grande_entreprise', 'ong', 'gouvernement']
    },
    localisation: {
      pays: String,
      ville: String
    },
    siteWeb: String,
    description: String
  },
  
  // Détails de la mission
  mission: {
    titre: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 3000
    },
    type: {
      type: String,
      enum: ['temps_plein', 'temps_partiel', 'freelance', 'contrat', 'stage'],
      required: true
    },
    duree: {
      type: String,
      enum: ['court_terme', 'moyen_terme', 'long_terme', 'permanent']
    },
    dateDebut: Date,
    dateFin: Date,
    urgence: {
      type: String,
      enum: ['faible', 'moyenne', 'haute', 'critique'],
      default: 'moyenne'
    }
  },
  
  // Compétences requises
  competencesRequises: [{
    nom: {
      type: String,
      required: true
    },
    niveau: {
      type: String,
      enum: ['debutant', 'intermediaire', 'avance', 'expert'],
      required: true
    },
    obligatoire: {
      type: Boolean,
      default: true
    },
    anneesExperience: Number
  }],
  
  domaines: [{
    type: String,
    enum: [
      'developpement_web', 'developpement_mobile', 'data_science', 'ia_ml',
      'cybersecurite', 'devops', 'cloud', 'blockchain', 'iot', 'fintech',
      'edtech', 'healthtech', 'agritech', 'cleantech', 'e_commerce',
      'design_ui_ux', 'product_management', 'consulting', 'formation'
    ]
  }],
  
  // Budget et conditions
  budget: {
    type: {
      type: String,
      enum: ['horaire', 'journalier', 'projet', 'mensuel'],
      required: true
    },
    montant: {
      min: Number,
      max: Number,
      devise: {
        type: String,
        default: 'USD'
      }
    },
    negociable: {
      type: Boolean,
      default: true
    }
  },
  
  // Préférences géographiques
  localisationPreferee: {
    regions: [{
      type: String,
      enum: ['Afrique_Ouest', 'Afrique_Est', 'Afrique_Nord', 'Afrique_Centrale', 'Afrique_Sud', 'International']
    }],
    pays: [String],
    remote: {
      type: Boolean,
      default: true
    },
    voyage: {
      type: Boolean,
      default: false
    },
    fuseauxHoraires: [String]
  },
  
  // Langues requises
  languesRequises: [{
    langue: {
      type: String,
      required: true
    },
    niveau: {
      type: String,
      enum: ['debutant', 'intermediaire', 'courant', 'natif'],
      required: true
    }
  }],
  
  // Statut et gestion
  statut: {
    type: String,
    enum: ['brouillon', 'active', 'en_cours', 'fermee', 'annulee'],
    default: 'brouillon'
  },
  
  candidatures: [{
    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TalentProfile'
    },
    dateCandidature: {
      type: Date,
      default: Date.now
    },
    statut: {
      type: String,
      enum: ['en_attente', 'vue', 'preselectionne', 'accepte', 'refuse'],
      default: 'en_attente'
    },
    tarifPropose: {
      montant: Number,
      devise: String
    },
    messageMotivation: String,
    documentsJoints: [String]
  }],
  
  // Métriques
  metriques: {
    vues: {
      type: Number,
      default: 0
    },
    candidatures: {
      type: Number,
      default: 0
    },
    matchsIA: {
      type: Number,
      default: 0
    }
  },
  
  // Options premium
  premium: {
    mise_en_avant: {
      type: Boolean,
      default: false
    },
    recherche_proactive: {
      type: Boolean,
      default: false
    },
    support_dedie: {
      type: Boolean,
      default: false
    }
  },
  
  dateExpiration: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches de demandes
talentRequestSchema.index({ 'mission.type': 1, statut: 1 });
talentRequestSchema.index({ domaines: 1, statut: 1 });
talentRequestSchema.index({ 'competencesRequises.nom': 1, 'competencesRequises.niveau': 1 });
talentRequestSchema.index({ 'localisationPreferee.regions': 1, 'localisationPreferee.remote': 1 });
talentRequestSchema.index({ 'budget.montant.min': 1, 'budget.montant.max': 1 });
talentRequestSchema.index({ createdAt: -1, statut: 1 });

// Schéma pour les matches IA
const aiMatchSchema = new mongoose.Schema({
  talent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TalentProfile',
    required: true
  },
  
  demande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TalentRequest',
    required: true
  },
  
  scoreMatch: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  criteres: {
    competences: {
      score: Number,
      details: [{
        competence: String,
        requis: String,
        possede: String,
        match: Boolean
      }]
    },
    
    localisation: {
      score: Number,
      distance: Number,
      fuseauHoraire: Boolean,
      remote: Boolean
    },
    
    budget: {
      score: Number,
      compatible: Boolean,
      ecart: Number
    },
    
    experience: {
      score: Number,
      anneesRequises: Number,
      anneesPossedees: Number
    },
    
    langues: {
      score: Number,
      details: [{
        langue: String,
        requis: String,
        possede: String,
        match: Boolean
      }]
    },
    
    disponibilite: {
      score: Number,
      typeMatch: Boolean,
      dateMatch: Boolean
    }
  },
  
  recommandations: [{
    type: String,
    message: String,
    priorite: {
      type: String,
      enum: ['faible', 'moyenne', 'haute']
    }
  }],
  
  statut: {
    type: String,
    enum: ['nouveau', 'vu_talent', 'vu_recruteur', 'interesse', 'rejete'],
    default: 'nouveau'
  },
  
  dateMatch: {
    type: Date,
    default: Date.now
  },
  
  interactions: [{
    acteur: {
      type: String,
      enum: ['talent', 'recruteur']
    },
    action: {
      type: String,
      enum: ['vue', 'interesse', 'contact', 'rejete']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index pour les matches
aiMatchSchema.index({ talent: 1, demande: 1 }, { unique: true });
aiMatchSchema.index({ scoreMatch: -1, dateMatch: -1 });
aiMatchSchema.index({ statut: 1, dateMatch: -1 });

const TalentProfile = mongoose.model('TalentProfile', talentProfileSchema);
const TalentRequest = mongoose.model('TalentRequest', talentRequestSchema);
const AIMatch = mongoose.model('AIMatch', aiMatchSchema);

module.exports = {
  TalentProfile,
  TalentRequest,
  AIMatch
};
