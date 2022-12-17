const jwt = require("jsonwebtoken")
const config = require("config")
const UserLevels = require("../constants/user_levels")


module.exports = (req,res,next)=>{
    const token = req.header("x-auth-token")
    if(!token)return res.status(401).send("token must be provided")

    try{
        const admin=jwt.verify(token,config.get("jwtPrivateKey"))
        if(admin.userLevel != UserLevels.admin){
            return res.status(403).send("Access Denied")
        }
        req.admin=admin
        next()
    }catch(e){
        res.status(400).send("invalid token")
    }
}