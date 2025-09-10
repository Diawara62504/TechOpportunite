const express = require("express");
const {connect} = require("./config/db");
const router = require("./routes/user.route");
const logger = require("./middlewares/middlogger");
const routerOffer = require("./routes/offer.route");
const routeStats = require("./routes/stats.route");
const routerNotif = require("./routes/notif.routes");
const routerMessage = require("./routes/message.routes");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const { error } = require("./middlewares/error.middleware");

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({ origin: "http://localhost:5173", credentials: true }))

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static('uploads'));

connect();

app.use(logger);

app.use("/user", router);
app.use("/offer", routerOffer);
app.use("/stats", routeStats);
app.use("/notification", routerNotif)
app.use("/message", routerMessage);
app.use(error)
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Démarrage au port ${port} sur http://localhost:${port}`);
});
