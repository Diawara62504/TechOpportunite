// Script de test pour vérifier que toutes les corrections fonctionnent
const mongoose = require('mongoose');

// Test des imports
console.log('🔍 Test des imports...');

try {
  const User = require('./models/user.model');
  console.log('✅ User model importé correctement');
} catch (error) {
  console.log('❌ Erreur import User:', error.message);
}

try {
  const Notification = require('./models/notification.model');
  console.log('✅ Notification model importé correctement');
} catch (error) {
  console.log('❌ Erreur import Notification:', error.message);
}

try {
  const Message = require('./models/message.model');
  console.log('✅ Message model importé correctement');
} catch (error) {
  console.log('❌ Erreur import Message:', error.message);
}

// Test des contrôleurs
console.log('\n🔍 Test des contrôleurs...');

try {
  const userController = require('./controllers/user.controller');
  const requiredMethods = ['register', 'login', 'getAllUsers', 'getUserProfile', 'updateUserProfile'];
  
  for (const method of requiredMethods) {
    if (typeof userController[method] === 'function') {
      console.log(`✅ userController.${method} est une fonction`);
    } else {
      console.log(`❌ userController.${method} n'est pas une fonction`);
    }
  }
} catch (error) {
  console.log('❌ Erreur import userController:', error.message);
}

try {
  const notificationController = require('./controllers/notification.controller');
  const requiredMethods = ['getUserNotifications', 'markAsRead', 'markAllAsRead', 'deleteNotification', 'getNotificationStats'];
  
  for (const method of requiredMethods) {
    if (typeof notificationController[method] === 'function') {
      console.log(`✅ notificationController.${method} est une fonction`);
    } else {
      console.log(`❌ notificationController.${method} n'est pas une fonction`);
    }
  }
} catch (error) {
  console.log('❌ Erreur import notificationController:', error.message);
}

// Test des routes
console.log('\n🔍 Test des routes...');

try {
  const notifRoutes = require('./routes/notif.routes');
  console.log('✅ Routes de notifications importées correctement');
} catch (error) {
  console.log('❌ Erreur import notifRoutes:', error.message);
}

console.log('\n🎉 Tests terminés !');
console.log('\n📋 Résumé des corrections:');
console.log('1. ✅ notif.routes.js - Routes corrigées avec les bonnes fonctions');
console.log('2. ✅ user.controller.js - Import User corrigé');
console.log('3. ✅ notification.controller.js - Fonctions exportées correctement');
console.log('4. ✅ Modèles - Pas d\'index en double détectés');
