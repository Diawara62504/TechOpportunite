const mongoose = require('mongoose');
const User = require('./models/user.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techopportunites')
  .then(async () => {
    try {
      const admins = await User.find({ role: 'admin' });
      console.log('=== UTILISATEURS ADMIN TROUVÉS ===');
      console.log('Nombre d\'admins:', admins.length);

      if (admins.length === 0) {
        console.log('Aucun admin trouvé. Création d\'un compte admin par défaut...');

        // Créer un admin par défaut
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new User({
          nom: 'Admin',
          prenom: 'System',
          email: 'admin@techopportunites.com',
          password: hashedPassword,
          preference: ['Technologie'],
          role: 'admin',
          titre: 'Administrateur Système',
          entreprise: 'TechOpportunités',
          validationStatus: 'approved'
        });

        await adminUser.save();
        console.log('✅ Compte admin créé avec succès!');
        console.log('📧 Email: admin@techopportunites.com');
        console.log('🔑 Mot de passe: admin123');
      } else {
        admins.forEach((admin, index) => {
          console.log(`${index + 1}. ${admin.prenom} ${admin.nom}`);
          console.log(`   Email: ${admin.email}`);
          console.log(`   Statut: ${admin.validationStatus}`);
          console.log('---');
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });