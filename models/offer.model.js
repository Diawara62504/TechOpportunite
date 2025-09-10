const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, "le titre est requis"],
  },
  description: {
    type: String,
  },
  type: { type: String },
  date: { type: Date },
  localisation: { type: String },
  source: { type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits" },
  technologies: { type: String, required: true },
  persAyantPost: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscrits",
    },
  ],
  candidatures: [
    {
      candidat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inscrits",
        required: true
      },
      dateCandidature: {
        type: Date,
        default: Date.now
      },
      statut: {
        type: String,
        enum: ['en_attente', 'accepte', 'refuse'],
        default: 'en_attente'
      }
    }
  ]
});

module.exports = mongoose.model("Offre", offerSchema);
