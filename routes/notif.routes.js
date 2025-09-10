const { ajoutnotif, affichenotif, marquerCommeLu } = require("../controllers/notification.controller")

const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")

router.post("/", auth, ajoutnotif)
router.get("/", auth, affichenotif)
router.put("/:id/lu", auth, marquerCommeLu) // Marquer une notification comme lue

module.exports = router;
