const logger = async (req, res, next)=>{
    console.log(`Requête efffectué [${new Date().toISOString()}], ${req.method}, ${req.originalUrl}`)
    next()
}

module.exports = logger;