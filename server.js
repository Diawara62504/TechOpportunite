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

// CORS: ouvrir mondialement (tout pays, tout domaine) pour rendre la plateforme accessible
const corsOptions = {
  origin: true, // Reflect request origin (access mondial)
  credentials: true
};
app.use(cors(corsOptions));

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static('uploads'));

connect();

app.use(logger);

// API routes with /api prefix
app.use("/api/user", router);
app.use("/api/offers", routerOffer);
app.use("/api/stats", routeStats);
app.use("/api/notification", routerNotif)
app.use("/api/message", routerMessage);
app.use("/api/chatbot", routerChatbot);
app.use("/api/analytics", routerAnalytics);
app.use("/api/ai-matching", routerAiMatching);
app.use("/api/gamification", routerGamification);
app.use("/api/marketplace", routerMarketplace);
app.use("/api/video-interviews", routerVideoInterview);
app.use('/api/admin', require('./routes/admin.route'));


// Validation routes
const validationRoutes = require("./routes/validation.routes");
app.use("/api", validationRoutes);

app.use(error)

// Socket.IO setup
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://techopportunite.onrender.com",
      "http://localhost:3000"
    ],
    credentials: true
  }
});
setSocket(io);

io.on("connection", (socket) => {
  // Le client doit envoyer son userId pour rejoindre sa "room" personnelle
  socket.on("register:user", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
});

const port = process.env.PORT;
server.listen(port, () => {
  console.log(`Démarrage au port ${port} sur http://localhost:${port}`);
});
