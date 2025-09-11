const mongoose = require("mongoose");

// Modèle pour stocker les scores de matching IA
const aiMatchingSchema = new mongoose.Schema({
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits",
    required: true
  },
  offre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offre",
    required: true
  },
  scoreGlobal: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  scores: {
    competencesTechniques: { type: Number, min: 0, max: 100 },
    experience: { type: Number, min: 0, max: 100 },
    localisation: { type: Number, min: 0, max: 100 },
    salaire: { type: Number, min: 0, max: 100 },
    culturel: { type: Number, min: 0, max: 100 }
  },
  recommandations: [{
    type: { type: String, enum: ['formation', 'certification', 'experience'] },
    description: String,
    priorite: { type: String, enum: ['haute', 'moyenne', 'basse'] }
  }],
  dateCalcul: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['actif', 'expire', 'archive'],
    default: 'actif'
  }
});

// Index pour optimiser les requêtes
aiMatchingSchema.index({ candidat: 1, offre: 1 }, { unique: true });
aiMatchingSchema.index({ scoreGlobal: -1 });
aiMatchingSchema.index({ dateCalcul: -1 });

module.exports = mongoose.model("AIMatching", aiMatchingSchema);
