const mongoose = require("mongoose");

// Modèle pour les tests techniques
const techTestSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  technologie: {
    type: String,
    required: true,
    enum: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'PHP', 'C++', 'Go', 'Ruby', 'Swift', 'Kotlin', 'TypeScript', 'Vue.js', 'Angular', 'Django', 'Laravel', 'Spring', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP']
  },
  niveau: {
    type: String,
    required: true,
    enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert']
  },
  dureeEstimee: {
    type: Number, // en minutes
    required: true,
    min: 5,
    max: 180
  },
  questions: [{
    type: {
      type: String,
      enum: ['code', 'qcm', 'debug', 'architecture'],
      required: true
    },
    enonce: {
      type: String,
      required: true
    },
    codeInitial: String, // Pour les questions de code
    solutionAttendue: String, // Solution de référence
    testsUnitaires: [{
      input: String,
      expectedOutput: String,
      description: String
    }],
    choixMultiples: [{ // Pour les QCM
      texte: String,
      correct: Boolean
    }],
    points: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    explication: String // Explication de la solution
  }],
  pointsTotal: {
    type: Number,
    required: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: true
  },
  statut: {
    type: String,
    enum: ['brouillon', 'actif', 'archive'],
    default: 'brouillon'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  },
  statistiques: {
    nombreTentatives: { type: Number, default: 0 },
    scoreMoyen: { type: Number, default: 0 },
    tauxReussite: { type: Number, default: 0 }
  }
});

// Index pour optimiser les recherches
techTestSchema.index({ technologie: 1, niveau: 1 });
techTestSchema.index({ statut: 1 });
techTestSchema.index({ createur: 1 });

module.exports = mongoose.model("TechTest", techTestSchema);
