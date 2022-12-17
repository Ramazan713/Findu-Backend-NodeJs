const config = require("config")
const winston = require("winston")


module.exports = function(){
    if(!config.get("jwtPrivateKey")){
        winston.error("FATAL ERROR: jwtPrivateKey is not defined")
        process.exit(1)
    }
    if(!config.get("emailUser")){
        winston.error("FATAL ERROR: emailUser is not defined")
        process.exit(1)
    }
    if(!config.get("emailPassword")){
        winston.error("FATAL ERROR: emailPassword is not defined")
        process.exit(1)
    }
}