const jwt = require("jsonwebtoken")
const config = require("config")
const UserLevels = require("../constants/user_levels")

module.exports = (...allowedUserLevel) => async(req,res,next)=>{
    const token = req.header("x-auth-token")
    
    if(!token){
        if(allowedUserLevel.includes(UserLevels.anonymous)){
            req.userType = UserLevels.anonymous
            return next()
        }else{
            return res.status(401).send("token must be provided")
        }
    }
    
    try{
        const userType = jwt.verify(token,config.get("jwtPrivateKey"))
        if(!allowedUserLevel.includes(userType.userLevel)){
            return res.status(403).send("Access Denied")
        }
        req.userType = userType
        next()
    }catch(e){
        res.status(400).send("invalid token")
    }
}