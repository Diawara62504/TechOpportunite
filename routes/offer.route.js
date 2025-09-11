const {createOffer, getAllOffer, filter, getOfferById, applyToOffer, getMyOffers, updateApplicationStatus} = require("../controllers/offer.controller")
const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")

router.post("/", auth, createOffer)
router.get("/", getAllOffer)
router.get("/details/:id", getOfferById)
router.post("/apply/:id", auth, applyToOffer)
router.get("/my-offers", auth, getMyOffers)
router.put("/application/:candidatureId", auth, updateApplicationStatus)
router.get("/:id",auth, filter)

module.exports = router;
