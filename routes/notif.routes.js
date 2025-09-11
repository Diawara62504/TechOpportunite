const { ajoutnotif, affichenotif, marquerCommeLu, getUnreadCount } = require("../controllers/notification.controller")

const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")

router.post("/", auth, ajoutnotif)
router.get("/", auth, affichenotif)
router.get("/unread-count", auth, getUnreadCount)
router.put("/:id/lu", auth, marquerCommeLu)

module.exports = router;
