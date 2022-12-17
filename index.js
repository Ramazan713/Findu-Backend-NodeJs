const express = require("express");
const config = require("config");
const winston = require("winston");

const app = express()

require("./startup/validation")()
require("./startup/logging")()
require("./startup/db")()
require("./startup/routes")(app)
require("./startup/config")()


app.get("/",(req,res)=>{
    res.send("Hello World")
})


const port = config.get("port") || 8080
const server=app.listen(port,()=>{
    winston.info(`listening on port ${port}`)
})

module.exports = server





