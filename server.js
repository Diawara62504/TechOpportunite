const express = require("express");
const http = require("http");
const path = require("path");

// Charger les variables d'environnement depuis config/.env
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

const {connect} = require("./config/db");
const router = require("./routes/user.route");
const logger = require("./middlewares/middlogger");
const routerOffer = require("./routes/offer.route");
const routeStats = require("./routes/stats.route");
const routerMessage = require("./routes/message.routes");
const routerChatbot = require("./routes/chatbot.routes");
const routerAnalytics = require("./routes/analytics.routes");
const routerAiMatching = require("./routes/aiMatching.routes");
const routerGamification = require("./routes/gamification.routes");
const routerMarketplace = require("./routes/marketplace.routes");
const routerVideoInterview = require("./routes/videoInterview.routes");
const routerAdminRecruiters = require("./routes/adminRecruiters.route");
const routerRecruiter = require("./routes/recruiter.route");
const routerNotification = require("./routes/notification.route");
const routerMessaging = require("./routes/messaging.route");
const routerDebug = require("./routes/debug.route");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const { error } = require("./middlewares/error.middleware");
const { setSocket } = require("./utils/socket");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser())

// Middleware de logging pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log(`   Headers:`, {
    'Content-Type': req.get('Content-Type'),
    'Authorization': req.get('Authorization') ? 'Present' : 'Missing',
    'Origin': req.get('Origin'),
    'User-Agent': req.get('User-Agent')?.substring(0, 50) + '...'
  });
  next();
});

// CORS: Configuration sécurisée pour les environnements de développement et production
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://techopportunite.vercel.app",
    "https://techopportunite.onrender.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Pour supporter les anciens navigateurs
};
app.use(cors(corsOptions));

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static('uploads'));

connect();

app.use(logger);

// API routes with /api prefix for consistency
app.use("/api/user", router);
app.use("/api/offers", routerOffer);
app.use("/api/stats", routeStats);
app.use("/api/message", routerMessage);
app.use("/api/chatbot", routerChatbot);
app.use("/api/analytics", routerAnalytics);
app.use("/api/ai-matching", routerAiMatching);
app.use("/api/gamification", routerGamification);
app.use("/api/marketplace", routerMarketplace);
app.use("/api/video-interviews", routerVideoInterview);
app.use('/api/recruiter', routerRecruiter);
app.use('/api/notifications', routerNotification);
app.use('/api/messaging', routerMessaging);
app.use('/api/debug', routerDebug);
app.use('/api/admin', require('./routes/admin.route'));
app.use('/api/admin', routerAdminRecruiters);

// Routes sans préfixe supprimées pour éviter les doublons et incohérences


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
  console.log(` Serveur démarré avec succès !`);
  
});
