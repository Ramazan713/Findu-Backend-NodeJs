const mongoose  = require("mongoose")


module.exports = (param)=> function(req,res,next){
    if(!mongoose.Types.ObjectId.isValid(param!=null?param:req.params.id)){
        return res.status(404).send("invalid token")
    }
    next()
}