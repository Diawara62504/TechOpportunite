const mongoose = require("mongoose");

require("dotenv").config({ path: "./config/.env" });

exports.connect = async () => {
  try {
    // Configuration robuste pour MongoDB Atlas
    const mongoOptions = {
      // Timeouts optimisés
      serverSelectionTimeoutMS: 30000, // 30 secondes pour la sélection du serveur
      socketTimeoutMS: 60000, // 60 secondes pour les opérations socket
      connectTimeoutMS: 30000, // 30 secondes pour la connexion initiale
      maxPoolSize: 10, // Taille maximale du pool de connexions
      minPoolSize: 2, // Taille minimale du pool
      maxIdleTimeMS: 30000, // Fermer les connexions inactives après 30s
      retryWrites: true, // Réessayer les écritures en cas d'échec
      retryReads: true, // Réessayer les lectures en cas d'échec

      // Configuration réseau
      family: 4, // Utiliser IPv4 uniquement

      // SSL/TLS
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,

      // Monitoring
      bufferCommands: false // Désactiver le buffering des commandes
    };

    // Utiliser l'URI MongoDB depuis les variables d'environnement
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO || 'mongodb://localhost:27017/techopportunites';

    if (!mongoUri) {
      console.log("⚠️ URI MongoDB manquante, utilisation de la base locale par défaut");
    }

    console.log("🔄 Tentative de connexion à MongoDB...");
    console.log("📍 URI:", mongoUri.replace(/\/\/.*@/, "//***:***@")); // Masquer les credentials

    await mongoose.connect(mongoUri, mongoOptions);

    console.log("✅ Connecté à MongoDB Atlas avec succès !");
    console.log("📊 Base de données: techopportunites");
    console.log("🔗 État de la connexion:", mongoose.connection.readyState);

    // Gestionnaire d'événements de connexion
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connecté à MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📡 Mongoose déconnecté de MongoDB');
    });

    // Test de la connexion
    const dbName = mongoose.connection.name;
    console.log(`📋 Base de données active: ${dbName}`);

  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   CodeName:", error.codeName);

    // Erreurs spécifiques MongoDB Atlas
    if (error.code === 8000) {
      console.error("💡 Solution: Vérifiez vos identifiants MongoDB Atlas");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEOUT') {
      console.error("💡 Solution: Vérifiez l'URL de connexion MongoDB Atlas");
      console.error("   - Assurez-vous que l'IP est autorisée dans Network Access");
      console.error("   - Vérifiez que le cluster est actif");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("💡 Solution: Vérifiez que MongoDB Atlas accepte les connexions depuis votre IP");
    } else if (error.name === 'MongoServerError') {
      console.error("💡 Solution: Vérifiez les permissions utilisateur dans MongoDB Atlas");
    }

    // Ne pas arrêter le serveur, mais logger l'erreur
    console.log("⚠️ Le serveur continue sans base de données");
    console.log("🔧 Certaines fonctionnalités peuvent ne pas fonctionner correctement");
  }
};
