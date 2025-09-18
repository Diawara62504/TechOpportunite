const mongoose = require('mongoose');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

async function createAdminAtlas() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');

    // Utiliser l'URL MongoDB Atlas depuis les variables d'environnement
    const mongoUri = process.env.MONGO;
    if (!mongoUri) {
      console.error('❌ Variable d\'environnement MONGO non trouvée');
      console.log('💡 Assurez-vous que votre fichier .env contient MONGO');
      process.exit(1);
    }

    await mongoose.connect(`${mongoUri}techopportunites?retryWrites=true&w=majority`);
    console.log('✅ Connecté à MongoDB Atlas');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Un compte admin existe déjà :');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.prenom, existingAdmin.nom);
      process.exit(0);
    }

    // Créer un nouvel admin
    console.log('👤 Création du compte admin...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('AdminTech2024!', salt);

    const adminUser = new User({
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@techopportunites.com',
      password: hashedPassword,
      preference: ['Administration', 'Technologie', 'RH'],
      role: 'admin',
      titre: 'Administrateur Système',
      entreprise: 'TechOpportunités',
      localisation: 'Paris',
      telephone: '+33123456789',
      linkedin: 'https://linkedin.com/company/techopportunites',
      about: 'Administrateur système de la plateforme TechOpportunités',
      validationStatus: 'approved'
    });

    await adminUser.save();

    console.log('\n🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS ! 🎉');
    console.log('═══════════════════════════════════════');
    console.log('👤 Nom: Système Admin');
    console.log('📧 Email: admin@techopportunites.com');
    console.log('🔑 Mot de passe: AdminTech2024!');
    console.log('🏢 Entreprise: TechOpportunités');
    console.log('📍 Localisation: Paris');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🔐 INSTRUCTIONS DE CONNEXION:');
    console.log('1. Allez sur votre frontend déployé');
    console.log('2. Cliquez sur "Se connecter"');
    console.log('3. Utilisez les identifiants ci-dessus');
    console.log('4. Après connexion, vous serez redirigé vers /admin');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('- Changez le mot de passe après la première connexion');
    console.log('- Gardez ces identifiants en sécurité');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error.message);
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Conseils de dépannage:');
      console.log('1. Vérifiez que MONGODB_URI dans .env est correct');
      console.log('2. Assurez-vous que l\'IP de votre serveur est autorisée dans MongoDB Atlas');
      console.log('3. Vérifiez les credentials MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB Atlas');
  }
}

createAdminAtlas();