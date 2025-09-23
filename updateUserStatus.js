const mongoose = require("mongoose");
require("dotenv").config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/techopportunites");
    console.log("✅ Connexion à MongoDB réussie");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

// Modèle utilisateur
const userSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: String,
  password: String,
  preference: [String],
  about: String,
  role: {
    type: String,
    enum: ['candidat', 'recruteur', 'admin'],
    default: 'candidat'
  },
  validationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved'
  },
  credibilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

const User = mongoose.model("User", userSchema);

// Fonction pour mettre à jour le statut des utilisateurs
const updateUserStatus = async () => {
  try {
    console.log("🔄 Mise à jour du statut des utilisateurs...");
    
    // Mettre à jour tous les utilisateurs avec le statut 'pending' vers 'approved'
    const result = await User.updateMany(
      { validationStatus: 'pending' },
      { $set: { validationStatus: 'approved' } }
    );
    
    console.log(`✅ ${result.modifiedCount} utilisateurs mis à jour de 'pending' vers 'approved'`);
    
    // Afficher le nombre total d'utilisateurs
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total d'utilisateurs dans la base: ${totalUsers}`);
    
    // Afficher la répartition par statut
    const statusCounts = await User.aggregate([
      { $group: { _id: "$validationStatus", count: { $sum: 1 } } }
    ]);
    
    console.log("📈 Répartition par statut:");
    statusCounts.forEach(status => {
      console.log(`   - ${status._id}: ${status.count} utilisateurs`);
    });
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Connexion fermée");
  }
};

// Exécuter le script
const run = async () => {
  await connectDB();
  await updateUserStatus();
};

run();
