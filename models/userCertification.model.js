const mongoose = require("mongoose");

// Modèle pour les certifications obtenues par les utilisateurs
const userCertificationSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: true
  },
  certification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Certification",
    required: true
  },
  dateObtention: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    required: true
  },
  scoreObtenu: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  testsReussis: [{
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechTest"
    },
    resultat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestResult"
    },
    score: Number,
    datePassage: Date
  }],
  statut: {
    type: String,
    enum: ['active', 'expiree', 'suspendue', 'revoquee'],
    default: 'active'
  },
  preuves: [{
    type: String,
    enum: ['test_technique', 'projet_pratique', 'experience_professionnelle', 'formation'],
    description: String,
    url: String, // lien vers le projet/portfolio
    dateValidation: Date
  }],
  verificateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits" // Admin ou expert qui a validé
  },
  certificatUrl: String, // URL du certificat PDF généré
  partage: {
    public: { type: Boolean, default: true },
    linkedin: { type: Boolean, default: false },
    portfolio: { type: Boolean, default: true }
  },
  renouvellements: [{
    dateRenouvellement: Date,
    scoreRenouvellement: Number,
    validiteJusquA: Date
  }],
  statistiquesUtilisation: {
    vuesProfil: { type: Number, default: 0 },
    candidaturesAvecCertif: { type: Number, default: 0 },
    offresRecommandees: { type: Number, default: 0 }
  }
});

// Index pour optimiser les requêtes
userCertificationSchema.index({ utilisateur: 1, certification: 1 }, { unique: true });
userCertificationSchema.index({ dateObtention: -1 });
userCertificationSchema.index({ statut: 1 });
userCertificationSchema.index({ dateExpiration: 1 });

// Méthode pour vérifier si la certification est encore valide
userCertificationSchema.methods.isValid = function() {
  return this.statut === 'active' && this.dateExpiration > new Date();
};

// Méthode pour calculer les jours restants avant expiration
userCertificationSchema.methods.daysUntilExpiration = function() {
  const today = new Date();
  const expiration = new Date(this.dateExpiration);
  const diffTime = expiration - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model("UserCertification", userCertificationSchema);
