const { ajoutnotif, affichenotif, markAsRead, countUnread } = require("../controllers/notification.controller")

const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")

router.post("/", auth, ajoutnotif)
router.get("/", auth, affichenotif)
router.get("/unread-count", auth, countUnread)
router.put("/:id/read", auth, markAsRead)

module.exports = router;
