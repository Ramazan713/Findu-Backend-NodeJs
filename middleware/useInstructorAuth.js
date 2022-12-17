
const jwt = require("jsonwebtoken")
const config = require("config")
const UserLevels = require("../constants/user_levels")


module.exports = async(req,res,next)=>{
    const token = req.header("x-auth-token")
    if(!token) return res.status(401).send("token must be provided")
    try{
        const instructor = jwt.verify(token,config.get("jwtPrivateKey"))
        if(instructor.userLevel!=UserLevels.instructor){
            return res.status(403).send("Access Denied")
        }
        req.instructor = instructor
        next()
    }catch(e){
        res.status(400).send("invalid token")
    }
}