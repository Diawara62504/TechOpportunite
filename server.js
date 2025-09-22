const express = require("express");
const http = require("http");
const {connect} = require("./config/db");
const router = require("./routes/user.route");
const logger = require("./middlewares/middlogger");
const routerOffer = require("./routes/offer.route");
const routeStats = require("./routes/stats.route");
const routerNotif = require("./routes/notif.routes");
const routerMessage = require("./routes/message.routes");
const routerChatbot = require("./routes/chatbot.routes");
const routerAnalytics = require("./routes/analytics.routes");
const routerAiMatching = require("./routes/aiMatching.routes");
const routerGamification = require("./routes/gamification.routes");
const routerMarketplace = require("./routes/marketplace.routes");
const routerVideoInterview = require("./routes/videoInterview.routes");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const { error } = require("./middlewares/error.middleware");
const { setSocket } = require("./utils/socket");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser())

// CORS: Configuration sécurisée pour les environnements de développement et production
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://techopportunite.vercel.app",
    "https://techopportunite.onrender.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static('uploads'));

connect();

app.use(logger);

// API routes without /api prefix (as per documentation)
app.use("/user", router);
app.use("/offers", routerOffer);
app.use("/stats", routeStats);
app.use("/notification", routerNotif)
app.use("/message", routerMessage);
app.use("/chatbot", routerChatbot);
app.use("/analytics", routerAnalytics);
app.use("/ai-matching", routerAiMatching);
app.use("/gamification", routerGamification);
app.use("/marketplace", routerMarketplace);
app.use("/video-interviews", routerVideoInterview);
app.use('/admin', require('./routes/admin.route'));


// Validation routes
const validationRoutes = require("./routes/validation.routes");
app.use("/api", validationRoutes);

app.use(error)

// Socket.IO setup avec configuration optimisée pour Render et Vercel
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:5173",           // Développement local frontend
      "http://localhost:5174",           // Développement local frontend (autre port)
      "http://localhost:5175",           // Développement local frontend (autre port)
      "http://localhost:5176",           // Développement local frontend (autre port)
      "https://techopportunite.vercel.app", // Production frontend Vercel
      "https://techopportunite.onrender.com", // Production backend Render
      "http://localhost:3000"            // Développement alternatif
    ],
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  // Configuration pour Render (hébergement cloud)
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,      // 60 secondes
  pingInterval: 25000,     // 25 secondes
  upgradeTimeout: 30000,   // 30 secondes pour l'upgrade WebSocket
  maxHttpBufferSize: 1e8,  // 100MB max pour les fichiers
  connectTimeout: 45000    // 45 secondes pour la connexion initiale
});

setSocket(io);

// Gestionnaire de connexions Socket.IO avec logs détaillés
io.on("connection", (socket) => {
  console.log(`🔌 Nouvelle connexion WebSocket établie:`, {
    socketId: socket.id,
    userAgent: socket.handshake.headers['user-agent'],
    origin: socket.handshake.headers.origin,
    timestamp: new Date().toISOString(),
    transport: socket.conn.transport.name
  });

  // Le client doit envoyer son userId pour rejoindre sa "room" personnelle
  socket.on("register:user", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`👤 Utilisateur ${userId} rejoint sa room personnelle (socket: ${socket.id})`);
    }
  });

  // Gestionnaire de déconnexion
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Déconnexion WebSocket:`, {
      socketId: socket.id,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  });

  // Gestionnaire d'erreur
  socket.on("error", (error) => {
    console.error(`❌ Erreur WebSocket pour socket ${socket.id}:`, error);
  });

  // Ping/Pong pour maintenir la connexion
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://techopportunite.onrender.com'
    : `http://localhost:${port}`;
  console.log(`🚀 Serveur démarré avec succès !`);
  console.log(`📍 Port: ${port}`);
  console.log(`🌐 URL: ${baseUrl}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
