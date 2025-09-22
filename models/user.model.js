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
  logoUrl: { type: String, default: '' }, // Pour les recruteurs
  photoUrl: { type: String, default: '' }, // Photo du candidat (optionnelle)
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
  cvUrl: { type: String, default: '' },
  validationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  credibilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  credibilityIndicators: {
    emailVerified: { type: Boolean, default: false },
    hasCV: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    hasReferences: { type: Boolean, default: false },
    reportsCount: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model("User", userSchema);
