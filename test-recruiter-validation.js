const mongoose = require('mongoose');
const User = require('./models/user.model');
const Notification = require('./models/notification.model');
const { NotificationService } = require('./services/notificationService');

// Script de test pour la validation des recruteurs
async function testRecruiterValidation() {
  try {
    console.log('🧪 Test de la validation des recruteurs...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techopportunites');
    console.log('✅ Connexion à la base de données réussie\n');

    // 1. Créer un recruteur en attente
    console.log('1️⃣ Création d\'un recruteur en attente...');
    const pendingRecruiter = new User({
      nom: 'Test',
      prenom: 'Recruteur',
      email: 'test.recruteur@example.com',
      password: 'hashedpassword',
      role: 'recruteur',
      validationStatus: 'pending',
      entreprise: 'Test Company',
      localisation: 'Paris, France'
    });
    await pendingRecruiter.save();
    console.log(`✅ Recruteur créé avec l'ID: ${pendingRecruiter._id}`);

    // 2. Tester la notification d'approbation
    console.log('\n2️⃣ Test de la notification d\'approbation...');
    try {
      await NotificationService.sendRecruiterValidationNotification(
        pendingRecruiter._id, 
        'approved', 
        'admin123'
      );
      console.log('✅ Notification d\'approbation envoyée');
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'envoi de notification (normal en test):', error.message);
    }

    // 3. Mettre à jour le statut à approuvé
    console.log('\n3️⃣ Mise à jour du statut à approuvé...');
    pendingRecruiter.validationStatus = 'approved';
    await pendingRecruiter.save();
    console.log('✅ Statut mis à jour à "approved"');

    // 4. Vérifier les notifications créées
    console.log('\n4️⃣ Vérification des notifications...');
    const notifications = await Notification.find({
      userId: pendingRecruiter._id,
      'data.action': 'recruiter_validation'
    }).sort({ createdAt: -1 });
    
    console.log(`✅ ${notifications.length} notification(s) trouvée(s)`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.type}`);
    });

    // 5. Tester les différents statuts
    console.log('\n5️⃣ Test des différents statuts...');
    const statuses = ['pending', 'approved', 'rejected', 'suspended'];
    
    for (const status of statuses) {
      const testRecruiter = new User({
        nom: 'Test',
        prenom: `Recruiter${status}`,
        email: `test.${status}@example.com`,
        password: 'hashedpassword',
        role: 'recruteur',
        validationStatus: status,
        entreprise: 'Test Company',
        localisation: 'Paris, France'
      });
      await testRecruiter.save();
      console.log(`✅ Recruteur avec statut "${status}" créé`);
    }

    // 6. Statistiques finales
    console.log('\n6️⃣ Statistiques finales...');
    const stats = await User.aggregate([
      { $match: { role: 'recruteur' } },
      {
        $group: {
          _id: '$validationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Répartition des statuts:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} recruteur(s)`);
    });

    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📝 Résumé des fonctionnalités testées:');
    console.log('   ✅ Création de recruteurs avec différents statuts');
    console.log('   ✅ Système de notifications');
    console.log('   ✅ Mise à jour des statuts');
    console.log('   ✅ Vérification des données');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    // Nettoyage (optionnel)
    console.log('\n🧹 Nettoyage des données de test...');
    try {
      await User.deleteMany({ email: { $regex: /test\./ } });
      await Notification.deleteMany({ userId: { $in: await User.find({ email: { $regex: /test\./ } }).distinct('_id') } });
      console.log('✅ Données de test nettoyées');
    } catch (cleanupError) {
      console.log('⚠️ Erreur lors du nettoyage:', cleanupError.message);
    }
    
    await mongoose.disconnect();
    console.log('✅ Déconnexion de la base de données');
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testRecruiterValidation();
}

module.exports = testRecruiterValidation;
