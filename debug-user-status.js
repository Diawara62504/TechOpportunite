const mongoose = require('mongoose');
const User = require('./models/user.model');

// Script de debug pour vérifier le statut d'un utilisateur
async function debugUserStatus(userEmail) {
  try {
    console.log('🔍 Debug du statut utilisateur...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techopportunites');
    console.log('✅ Connexion à la base de données réussie\n');

    // Rechercher l'utilisateur par email
    const user = await User.findOne({ email: userEmail }).select('nom prenom email role validationStatus dateCreation');
    
    if (!user) {
      console.log(`❌ Utilisateur avec l'email "${userEmail}" non trouvé`);
      return;
    }

    console.log('👤 Informations utilisateur:');
    console.log(`   Nom: ${user.nom} ${user.prenom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Statut de validation: ${user.validationStatus}`);
    console.log(`   Date de création: ${user.dateCreation}`);

    // Vérifier les permissions
    console.log('\n🔐 Permissions:');
    console.log(`   Peut publier des offres: ${user.role === 'recruteur' && user.validationStatus === 'approved' ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Peut accéder au tableau de bord recruteur: ${user.role === 'recruteur' && user.validationStatus === 'approved' ? '✅ OUI' : '❌ NON'}`);

    // Si c'est un recruteur, vérifier les offres
    if (user.role === 'recruteur') {
      const Offer = require('./models/offer.model');
      const offers = await Offer.find({ source: user._id }).select('titre statut date');
      
      console.log(`\n📋 Offres publiées: ${offers.length}`);
      offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.titre} (${offer.statut}) - ${offer.date}`);
      });
    }

    // Vérifier les notifications
    const Notification = require('./models/notification.model');
    const notifications = await Notification.find({ userId: user._id }).select('title message type createdAt').sort({ createdAt: -1 }).limit(5);
    
    console.log(`\n🔔 Dernières notifications: ${notifications.length}`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}] ${notif.title} - ${notif.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion de la base de données');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const userEmail = process.argv[2];
  if (!userEmail) {
    console.log('Usage: node debug-user-status.js <email>');
    process.exit(1);
  }
  debugUserStatus(userEmail);
}

module.exports = debugUserStatus;
