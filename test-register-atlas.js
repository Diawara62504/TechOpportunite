const axios = require('axios');
const path = require('path');

// Charger les variables d'environnement depuis config/.env
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

async function testRegisterAtlas() {
  console.log('🧪 Test d\'inscription avec MongoDB Atlas...');
  console.log('🔑 Variables d\'env chargées:', {
    MONGO: process.env.MONGO ? 'Définie' : 'Non définie',
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    SECRET_KEY: process.env.SECRET_KEY ? 'Définie' : 'Non définie'
  });
  
  // Utiliser le backend hébergé sur Render
  const API_BASE_URL = 'https://techopportunite.onrender.com';
  
  const testUser = {
    nom: "Test",
    prenom: "User", 
    email: `test${Date.now()}@example.com`, // Email unique
    password: "password123",
    role: "candidate"
  };
  
  console.log('👤 Données de test:', {
    email: testUser.email,
    role: testUser.role,
    nom: testUser.nom,
    prenom: testUser.prenom
  });
  
  try {
    console.log('📡 Envoi de la requête d\'inscription...');
    const response = await axios.post(`${API_BASE_URL}/api/user/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 secondes timeout pour Atlas
    });
    
    console.log('✅ Inscription réussie !');
    console.log('📊 Status:', response.status);
    console.log('📄 Réponse:', JSON.stringify(response.data, null, 2));
    
    // Test de connexion avec le même utilisateur
    console.log('\n🔐 Test de connexion avec le nouvel utilisateur...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/user/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Status:', loginResponse.status);
    console.log('👤 Utilisateur connecté:', {
      id: loginResponse.data.user?._id,
      email: loginResponse.data.user?.email,
      role: loginResponse.data.user?.role
    });
    
  } catch (error) {
    console.error('❌ Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 500) {
      console.log('💡 Erreur 500: Problème serveur - vérifiez les logs du backend');
    } else if (error.response?.status === 404) {
      console.log('💡 Erreur 404: Route non trouvée - vérifiez l\'URL');
    } else if (error.response?.status === 400) {
      console.log('💡 Erreur 400: Données invalides - vérifiez le format des données');
    }
  }
}

// Fonction pour tester la connexion au backend
async function testBackendConnection() {
  console.log('🔍 Test de connexion au backend...');
  
  try {
    const response = await axios.get('https://techopportunite.onrender.com/api/offers?page=1&limit=1', {
      timeout: 10000
    });
    
    console.log('✅ Backend accessible !');
    console.log('📊 Status:', response.status);
    console.log('📄 Réponse:', response.data);
    
  } catch (error) {
    console.error('❌ Backend non accessible:', {
      status: error.response?.status,
      message: error.message
    });
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  // Test 1: Connexion backend
  await testBackendConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Inscription
  await testRegisterAtlas();
}

runTests();


