const { ajoutnotif, affichenotif } = require("../controllers/notification.controller")

const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")



router.post("/", auth, ajoutnotif)
router.get("/", auth,affichenotif)

module.exports = router;