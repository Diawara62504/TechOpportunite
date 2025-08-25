const mongoose = require("mongoose");

require("dotenv").config({ path: "./config/.env" });

exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connecté !");
  } catch (error) {
    console.log("Erreur de connexion ! ");
  }
};
