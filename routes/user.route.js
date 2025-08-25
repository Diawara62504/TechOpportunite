const user = require("../controllers/user.controller")
const router = require("express").Router()

router.post("/register", user.register)
router.post("/login", user.login)
router.get("/get", user.getUser)
router.get("/logout", user.logout)

module.exports = router;
