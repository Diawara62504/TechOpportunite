// Script de démarrage simple pour debug
const express = require("express");
const cors = require("cors");

const app = express();

// Configuration CORS
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://techopportunite.vercel.app",
    "https://techopportunite.onrender.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Route de test simple
app.get("/", (req, res) => {
  res.json({ message: "Serveur backend fonctionne !", timestamp: new Date().toISOString() });
});

// Route de test pour les offres
app.get("/offers", (req, res) => {
  res.json({
    success: true,
    page: 1,
    limit: 1,
    pageTotale: 1,
    total: 0,
    getoffer: []
  });
});

// Route de test pour le profil utilisateur
app.get("/user/profile", (req, res) => {
  res.status(401).json({ message: "Non authentifié: token manquant" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Serveur de test démarré sur le port ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
});
