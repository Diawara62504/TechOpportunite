const mongoose = require("mongoose");

// Modèle pour les badges disponibles
const badgeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icone: {
    type: String,
    required: true // URL ou nom de l'icône
  },
  couleur: {
    type: String,
    default: '#3B82F6'
  },
  categorie: {
    type: String,
    required: true,
    enum: [
      'tests', 'certifications', 'applications', 'profile', 
      'community', 'achievements', 'special', 'regional'
    ]
  },
  conditions: {
    type: {
      type: String,
      required: true,
      enum: [
        'test_count', 'test_score', 'certification_count', 'application_count',
        'profile_completion', 'login_streak', 'referral_count', 'special_event',
        'regional_leader', 'technology_expert', 'community_helper'
      ]
    },
    valeur: {
      type: Number,
      required: true
    },
    technologie: String, // Pour les badges spécifiques à une technologie
    region: String // Pour les badges régionaux
  },
  rarete: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: {
    type: Number,
    default: 10
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Modèle pour les niveaux d'utilisateur
const niveauSchema = new mongoose.Schema({
  niveau: {
    type: Number,
    required: true,
    unique: true
  },
  nom: {
    type: String,
    required: true
  },
  pointsRequis: {
    type: Number,
    required: true
  },
  couleur: {
    type: String,
    default: '#6B7280'
  },
  avantages: [{
    type: String,
    description: String
  }],
  icone: String
}, {
  timestamps: true
});

// Modèle pour le profil de gamification des utilisateurs
const userGamificationSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: true,
    unique: true
  },
  points: {
    total: { type: Number, default: 0 },
    semaine: { type: Number, default: 0 },
    mois: { type: Number, default: 0 }
  },
  niveau: {
    actuel: { type: Number, default: 1 },
    progression: { type: Number, default: 0 } // Pourcentage vers le niveau suivant
  },
  badges: [{
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge"
    },
    dateObtention: {
      type: Date,
      default: Date.now
    },
    visible: {
      type: Boolean,
      default: true
    }
  }],
  statistiques: {
    testsCompletes: { type: Number, default: 0 },
    certificationObtenues: { type: Number, default: 0 },
    candidaturesEnvoyees: { type: Number, default: 0 },
    joursConsecutifs: { type: Number, default: 0 },
    dernierLogin: Date,
    profileCompletion: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 }
  },
  preferences: {
    afficherBadges: { type: Boolean, default: true },
    afficherNiveau: { type: Boolean, default: true },
    notificationsGamification: { type: Boolean, default: true }
  },
  historique: [{
    action: String,
    points: Number,
    date: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Modèle pour les défis et quêtes
const challengeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'special', 'seasonal']
  },
  objectifs: [{
    description: String,
    type: String, // 'test_complete', 'application_send', etc.
    cible: Number,
    progres: { type: Number, default: 0 },
    complete: { type: Boolean, default: false }
  }],
  recompenses: {
    points: { type: Number, default: 0 },
    badges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge"
    }],
    special: String // Récompense spéciale (accès premium, etc.)
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  participants: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscrits"
    },
    progres: [{
      objectif: Number,
      valeur: Number,
      dateUpdate: { type: Date, default: Date.now }
    }],
    complete: { type: Boolean, default: false },
    dateCompletion: Date
  }],
  actif: {
    type: Boolean,
    default: true
  },
  region: String, // Pour les défis régionaux
  technologie: String // Pour les défis technologiques
}, {
  timestamps: true
});

// Modèle pour le leaderboard
const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['global', 'weekly', 'monthly', 'regional', 'technology']
  },
  periode: {
    debut: Date,
    fin: Date
  },
  region: String,
  technologie: String,
  classement: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscrits"
    },
    points: Number,
    position: Number,
    badges: Number,
    niveau: Number
  }],
  dernierUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Modèle pour les récompenses spéciales
const rewardSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['premium_access', 'course_access', 'mentoring', 'exclusive_jobs', 'swag']
  },
  conditions: {
    points: Number,
    niveau: Number,
    badges: [String],
    special: String
  },
  valeur: String, // Description de la valeur
  duree: Number, // Durée en jours
  stock: {
    type: Number,
    default: -1 // -1 = illimité
  },
  utilise: {
    type: Number,
    default: 0
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
userGamificationSchema.index({ 'points.total': -1 });
userGamificationSchema.index({ 'niveau.actuel': -1 });
userGamificationSchema.index({ utilisateur: 1 });

leaderboardSchema.index({ type: 1, 'periode.debut': -1 });
leaderboardSchema.index({ region: 1, technologie: 1 });

challengeSchema.index({ type: 1, actif: 1 });
challengeSchema.index({ dateDebut: 1, dateFin: 1 });

const Badge = mongoose.model("Badge", badgeSchema);
const Niveau = mongoose.model("Niveau", niveauSchema);
const UserGamification = mongoose.model("UserGamification", userGamificationSchema);
const Challenge = mongoose.model("Challenge", challengeSchema);
const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
const Reward = mongoose.model("Reward", rewardSchema);

module.exports = {
  Badge,
  Niveau,
  UserGamification,
  Challenge,
  Leaderboard,
  Reward
};
