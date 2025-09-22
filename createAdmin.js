const mongoose = require('mongoose');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: "./config/.env" });

async function createAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Un compte admin existe déjà :');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Mot de passe: (utilisez le mot de passe que vous avez défini)');
      process.exit(0);
    }

    // Créer un nouvel admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      nom: 'Admin',
      prenom: 'System',
      email: 'admin@techopportunites.com',
      password: hashedPassword,
      preference: ['Administration', 'Technologie'],
      role: 'admin',
      titre: 'Administrateur Système',
      entreprise: 'TechOpportunités',
      localisation: 'Paris',
      telephone: '+33123456789',
      validationStatus: 'approved'
    });

    await adminUser.save();

    console.log('🎉 Compte admin créé avec succès !');
    console.log('📧 Email: admin@techopportunites.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('');
    console.log('🔗 Vous pouvez maintenant vous connecter à :');
    console.log('   Frontend: http://localhost:5173/login');
    console.log('   Dashboard admin: http://localhost:5173/admin (après connexion)');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

createAdmin();