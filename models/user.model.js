const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preference: [{ type: String, required: true }],
  about: { type: String, default: '' },
  role: {
    type: String,
    enum: ['candidat', 'recruteur', 'admin'],
    default: 'candidat'
  },
  // Nouveaux champs professionnels
  titre: { type: String, default: '' }, // Ex: "Développeur Full-Stack Senior"
  entreprise: { type: String, default: '' },
  localisation: { type: String, default: '' },
  telephone: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  cvUrl: { type: String, default: '' }, // Added field for CV URL or path
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
  competences: [String],
  langues: [{
    langue: String,
    niveau: { type: String, enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Natif'] }
  }],
  dateCreation: { type: Date, default: Date.now },
  derniereConnexion: { type: Date, default: Date.now },
  cvUrl: { type: String, default: '' }
});

module.exports = mongoose.model("Inscrits", userSchema);
