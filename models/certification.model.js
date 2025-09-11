const mongoose = require("mongoose");

// Modèle pour les certifications
const certificationSchema = new mongoose.Schema({
  nom: {
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
    enum: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'PHP', 'C++', 'Go', 'Ruby', 'Swift', 'Kotlin', 'TypeScript', 'Vue.js', 'Angular', 'Django', 'Laravel', 'Spring', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'DevOps', 'Security', 'AI/ML']
  },
  niveau: {
    type: String,
    required: true,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
  },
  criteres: {
    scoreMinimum: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    testsRequis: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechTest"
    }],
    experienceMinimum: Number, // en années
    projetsPratiques: Number // nombre de projets requis
  },
  avantages: [{
    type: String,
    enum: ['badge_profil', 'priorite_candidature', 'acces_offres_premium', 'mentoring', 'networking', 'formation_avancee']
  }],
  validite: {
    duree: {
      type: Number, // en mois
      default: 24
    },
    renouvelable: {
      type: Boolean,
      default: true
    }
  },
  statistiques: {
    nombreCertifies: { type: Number, default: 0 },
    tauxReussite: { type: Number, default: 0 },
    scoreMoyenCertifies: { type: Number, default: 0 }
  },
  badge: {
    couleur: String,
    icone: String,
    design: String // URL ou code SVG
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inscrits"
  },
  statut: {
    type: String,
    enum: ['active', 'suspendue', 'archivee'],
    default: 'active'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les recherches
certificationSchema.index({ technologie: 1, niveau: 1 });
certificationSchema.index({ statut: 1 });

module.exports = mongoose.model("Certification", certificationSchema);
