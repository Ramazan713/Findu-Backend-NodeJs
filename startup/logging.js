require("express-async-errors")
const winston = require("winston");
const config = require("config");
require("winston-mongodb")

module.exports = function(){
    winston.add(new winston.transports.File({filename:"errors.log",level:"error",handleExceptions:true,handleRejections:true}))
    winston.add(new winston.transports.Console({level:"info",handleExceptions:true,handleRejections:true,format: winston.format.simple()}))

    process.on("unhandledRejection",(ex)=>{
        throw ex
    })
}