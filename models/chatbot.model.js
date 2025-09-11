const mongoose = require('mongoose');

// Schéma pour les conversations du chatbot
const chatConversationSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscrits',
    required: false // Peut être null pour les visiteurs anonymes
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  langue: {
    type: String,
    enum: ['fr', 'en', 'ar', 'pt', 'es', 'sw', 'ha', 'am'],
    default: 'fr'
  },
  statut: {
    type: String,
    enum: ['active', 'fermee', 'transferee'],
    default: 'active'
  },
  contexte: {
    page: String,
    userAgent: String,
    referrer: String,
    typeUtilisateur: {
      type: String,
      enum: ['candidat', 'recruteur', 'entreprise', 'visiteur'],
      default: 'visiteur'
    }
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }],
  satisfaction: {
    note: {
      type: Number,
      min: 1,
      max: 5
    },
    commentaire: String,
    dateEvaluation: Date
  },
  transfertHumain: {
    demande: {
      type: Boolean,
      default: false
    },
    raison: String,
    dateTransfert: Date,
    agentHumain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inscrits'
    }
  },
  metriques: {
    dureeConversation: Number, // en secondes
    nombreMessages: {
      type: Number,
      default: 0
    },
    problemeResolu: {
      type: Boolean,
      default: false
    },
    categorieProbleme: {
      type: String,
      enum: [
        'recherche_emploi', 'candidature', 'profil', 'tests_techniques',
        'certifications', 'marketplace', 'entretiens', 'technique',
        'facturation', 'autre'
      ]
    }
  }
}, {
  timestamps: true
});

// Schéma pour les messages individuels
const chatMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatConversation',
    required: true
  },
  expediteur: {
    type: String,
    enum: ['utilisateur', 'bot', 'agent_humain'],
    required: true
  },
  contenu: {
    texte: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['texte', 'boutons', 'carousel', 'fichier', 'lien'],
      default: 'texte'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  intentionDetectee: {
    nom: String,
    confiance: {
      type: Number,
      min: 0,
      max: 1
    },
    entites: [{
      nom: String,
      valeur: String,
      confiance: Number
    }]
  },
  reponseIA: {
    modele: String,
    tempsReponse: Number, // en millisecondes
    tokensUtilises: Number,
    cout: Number
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateMessage: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schéma pour la base de connaissances du chatbot
const knowledgeBaseSchema = new mongoose.Schema({
  categorie: {
    type: String,
    required: true,
    enum: [
      'faq_generale', 'inscription', 'recherche_emploi', 'candidature',
      'tests_techniques', 'certifications', 'marketplace', 'entretiens',
      'gamification', 'facturation', 'technique'
    ]
  },
  question: {
    type: String,
    required: true
  },
  reponse: {
    type: String,
    required: true
  },
  motsClefs: [{
    type: String,
    index: true
  }],
  langues: {
    fr: {
      question: String,
      reponse: String
    },
    en: {
      question: String,
      reponse: String
    },
    ar: {
      question: String,
      reponse: String
    },
    pt: {
      question: String,
      reponse: String
    },
    es: {
      question: String,
      reponse: String
    },
    sw: {
      question: String,
      reponse: String
    },
    ha: {
      question: String,
      reponse: String
    },
    am: {
      question: String,
      reponse: String
    }
  },
  popularite: {
    type: Number,
    default: 0
  },
  efficacite: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Schéma pour les intentions du chatbot
const chatIntentSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  exemples: [{
    texte: String,
    langue: String
  }],
  entitesRequises: [{
    nom: String,
    type: {
      type: String,
      enum: ['texte', 'nombre', 'date', 'email', 'telephone', 'url']
    },
    obligatoire: Boolean
  }],
  reponses: [{
    texte: String,
    langue: String,
    conditions: mongoose.Schema.Types.Mixed
  }],
  actions: [{
    type: {
      type: String,
      enum: ['api_call', 'redirect', 'form', 'transfer_human']
    },
    parametres: mongoose.Schema.Types.Mixed
  }],
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Schéma pour les métriques du chatbot
const chatAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  metriques: {
    conversationsTotal: {
      type: Number,
      default: 0
    },
    conversationsResolues: {
      type: Number,
      default: 0
    },
    transfertsHumains: {
      type: Number,
      default: 0
    },
    satisfactionMoyenne: {
      type: Number,
      default: 0
    },
    tempsReponseMoyen: {
      type: Number,
      default: 0
    },
    languesUtilisees: {
      fr: { type: Number, default: 0 },
      en: { type: Number, default: 0 },
      ar: { type: Number, default: 0 },
      pt: { type: Number, default: 0 },
      es: { type: Number, default: 0 },
      sw: { type: Number, default: 0 },
      ha: { type: Number, default: 0 },
      am: { type: Number, default: 0 }
    },
    categoriesProblemes: {
      recherche_emploi: { type: Number, default: 0 },
      candidature: { type: Number, default: 0 },
      profil: { type: Number, default: 0 },
      tests_techniques: { type: Number, default: 0 },
      certifications: { type: Number, default: 0 },
      marketplace: { type: Number, default: 0 },
      entretiens: { type: Number, default: 0 },
      technique: { type: Number, default: 0 },
      facturation: { type: Number, default: 0 },
      autre: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
chatConversationSchema.index({ utilisateur: 1, createdAt: -1 });
chatConversationSchema.index({ sessionId: 1, statut: 1 });
chatMessageSchema.index({ conversation: 1, dateMessage: 1 });
knowledgeBaseSchema.index({ categorie: 1, actif: 1 });
knowledgeBaseSchema.index({ motsClefs: 1 });
chatAnalyticsSchema.index({ date: -1 });

// Méthodes du schéma
chatConversationSchema.methods.ajouterMessage = function(messageData) {
  this.messages.push(messageData._id);
  this.metriques.nombreMessages += 1;
  return this.save();
};

chatConversationSchema.methods.fermerConversation = function() {
  this.statut = 'fermee';
  if (this.createdAt) {
    this.metriques.dureeConversation = Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  }
  return this.save();
};

knowledgeBaseSchema.methods.incrementerPopularite = function() {
  this.popularite += 1;
  return this.save();
};

// Méthodes statiques
chatConversationSchema.statics.obtenirStatistiques = function(dateDebut, dateFin) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: dateDebut,
          $lte: dateFin
        }
      }
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        conversationsResolues: {
          $sum: { $cond: ['$metriques.problemeResolu', 1, 0] }
        },
        satisfactionMoyenne: { $avg: '$satisfaction.note' },
        dureeConversationMoyenne: { $avg: '$metriques.dureeConversation' }
      }
    }
  ]);
};

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
const ChatIntent = mongoose.model('ChatIntent', chatIntentSchema);
const ChatAnalytics = mongoose.model('ChatAnalytics', chatAnalyticsSchema);

module.exports = {
  ChatConversation,
  ChatMessage,
  KnowledgeBase,
  ChatIntent,
  ChatAnalytics
};
