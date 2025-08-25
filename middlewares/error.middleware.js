exports.error= (err,req, res, next)=>{
    if(err){console.error(err.message)}else{next()}
}