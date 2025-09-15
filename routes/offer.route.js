const {createOffer, getAllOffer, filter, getOfferById, applyToOffer, getMyOffers, updateApplicationStatus} = require("../controllers/offer.controller")
const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const upload = require("../middlewares/upload.middleware");

router.post("/", auth, createOffer)
router.get("/", getAllOffer)
router.get("/details/:id", getOfferById)
// Permettre l'upload de CV/portfolio au moment de la candidature
router.post("/apply/:id", auth, upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'portfolio', maxCount: 1 }]), applyToOffer)
router.get("/my-offers", auth, getMyOffers)
router.put("/application/:candidatureId", auth, updateApplicationStatus)
router.get("/:id",auth, filter)

module.exports = router;
