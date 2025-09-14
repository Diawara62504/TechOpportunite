const express = require("express");
const {connect} = require("./config/db");
const router = require("./routes/user.route");
const logger = require("./middlewares/middlogger");
const routerOffer = require("./routes/offer.route");
const routeStats = require("./routes/stats.route");
const routerNotif = require("./routes/notif.routes");
const routerMessage = require("./routes/message.routes");
const routerChatbot = require("./routes/chatbot.routes");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const { error } = require("./middlewares/error.middleware");

const app = express();
app.use(express.json());
app.use(cookieParser())

// CORS configuration for both local development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173", // Local development
      "https://techopportunite.onrender.com", // Production frontend
      "http://localhost:3000" // Alternative local port
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use(error)
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Démarrage au port ${port} sur http://localhost:${port}`);
});
