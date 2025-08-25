const {createOffer, getAllOffer, filter} = require("../controllers/offer.controller")
const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")

router.post("/", auth, createOffer)
router.get("/", auth, getAllOffer)
router.get("/:id",auth, filter)

module.exports = router;
