const user = require("../controllers/user.controller")
const router = require("express").Router()
const tokenValide = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.post("/register", upload.single('cv'), user.register)
router.post("/login", user.login)
router.post("/refresh-token", user.refreshToken);
router.get("/get", user.getUser)
router.get("/logout", user.logout)
router.get("/profile", tokenValide, user.getUserProfile);
                                                                               router.put("/profile", tokenValide, upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), user.updateUserProfile);
router.get("/stats", tokenValide, user.getUserStats);
// Profil public candidat pour recruteurs
router.get("/candidate/:id", tokenValide, user.getCandidatePublicProfile);

module.exports = router;
