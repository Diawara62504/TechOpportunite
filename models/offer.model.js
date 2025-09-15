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
      },
      // Snapshot du profil candidat au moment de la candidature
      profilCandidat: {
        nom: String,
        prenom: String,
        email: String,
        titre: String,
        localisation: String,
        telephone: String,
        linkedin: String,
        github: String,
        portfolio: String,
        cvUrl: String,
        about: String,
        competences: [String],
        experience: [{
          poste: String,
          entreprise: String,
          dateDebut: Date,
          dateFin: Date,
          description: String,
          actuel: { type: Boolean, default: false }
        }],
        formation: [{
          diplome: String,
          etablissement: String,
          dateDebut: Date,
          dateFin: Date,
          description: String
        }],
        langues: [{
          langue: String,
          niveau: String
        }],
        // Résumé des tests/certifications pour décision rapide
        certifications: [{
          nom: String,
          niveau: String,
          scoreObtenu: Number,
          certificatUrl: String,
          dateObtention: Date
        }],
        tests: [{
          testTitre: String,
          technologie: String,
          niveau: String,
          scoreTotal: Number,
          pourcentageReussite: Number,
          dateFin: Date
        }]
      }
    }
  ]
});

module.exports = mongoose.model("Offre", offerSchema);
