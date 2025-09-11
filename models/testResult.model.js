const mongoose = require("mongoose");

// Modèle pour les résultats de tests techniques
const testResultSchema = new mongoose.Schema({
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechTest",
    required: true
  },
  dateDebut: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateFin: Date,
  dureeReelle: Number, // en minutes
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'abandonne', 'expire'],
    default: 'en_cours'
  },
  reponses: [{
    questionIndex: {
      type: Number,
      required: true
    },
    reponse: String, // Code ou réponse textuelle
    choixSelectionnes: [Number], // Index des choix pour QCM
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String, // Feedback automatique
    tempsEcoule: Number // temps en secondes pour cette question
  }],
  scoreTotal: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  pourcentageReussite: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  certification: {
    obtenue: { type: Boolean, default: false },
    niveau: String, // 'Bronze', 'Silver', 'Gold', 'Platinum'
    dateObtention: Date,
    validiteJusquA: Date
  },
  analyse: {
    pointsForts: [String],
    pointsFaibles: [String],
    recommandations: [String],
    comparaisonMoyenne: Number // Score par rapport à la moyenne
  },
  codeExecutions: [{
    questionIndex: Number,
    code: String,
    resultat: String,
    erreurs: [String],
    tempsExecution: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

// Index pour optimiser les requêtes
testResultSchema.index({ candidat: 1, test: 1 });
testResultSchema.index({ dateDebut: -1 });
testResultSchema.index({ scoreTotal: -1 });
testResultSchema.index({ 'certification.obtenue': 1 });

module.exports = mongoose.model("TestResult", testResultSchema);
