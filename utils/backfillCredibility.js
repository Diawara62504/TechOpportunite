const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

// Calculer les indicateurs de crédibilité
const calculateCredibilityIndicators = (user) => {
  return {
    emailVerified: user.credibilityIndicators?.emailVerified || false,
    hasCV: user.cvUrl ? true : false,
    profileCompleted: user.titre && user.entreprise && user.localisation && user.about ? true : false,
    hasReferences: user.credibilityIndicators?.hasReferences || false,
    reportsCount: user.credibilityIndicators?.reportsCount || 0
  };
};

// Calculer le score de crédibilité
const calculateCredibilityScore = (indicators, userData) => {
  let score = 0;

  if (indicators.emailVerified) score += 20;
  if (indicators.hasCV) score += 15;
  if (indicators.profileCompleted) score += 20;
  if (indicators.hasReferences) score += 15;
  if (userData.experience && userData.experience.length > 0) score += 15;
  if (userData.formation && userData.formation.length > 0) score += 10;
  if (userData.competences && userData.competences.length > 0) score += 5;

  return Math.min(Math.max(score, 0), 100);
};

async function backfillCredibility() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`Trouvé ${users.length} utilisateurs`);

    let updatedCount = 0;

    for (const user of users) {
      const indicators = calculateCredibilityIndicators(user);
      const score = calculateCredibilityScore(indicators, user);

      // Mettre à jour si nécessaire
      if (user.credibilityScore !== score || !user.credibilityIndicators) {
        user.credibilityScore = score;
        user.credibilityIndicators = indicators;
        await user.save();
        updatedCount++;
        console.log(`Mis à jour ${user.email}: score ${score}`);
      }
    }

    console.log(`Mis à jour ${updatedCount} utilisateurs`);
    console.log('Backfill terminé');

  } catch (error) {
    console.error('Erreur lors du backfill:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
}

backfillCredibility();