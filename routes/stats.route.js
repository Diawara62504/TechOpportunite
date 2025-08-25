const {getStats} = require("../controllers/stats.controller")
const router = require("express").Router()

router.get("/",  getStats)

module.exports=router