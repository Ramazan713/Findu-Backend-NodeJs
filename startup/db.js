const mongoose = require("mongoose")
const config = require("config")
const winston = require("winston")

const { userSchema } = require("../models/User")
const { instructorSchema } = require("../models/instructor")
const { tokenSchema } = require("../models/token")
const { categorySchema } = require("../models/category")
const { adminSchema } = require("../models/admin")
const { courseSchema } = require("../models/course")
const { fileSchema } = require("../models/files")


module.exports = function(){

    mongoose.model("Token",tokenSchema)
    mongoose.model("User",userSchema)
    mongoose.model("Instructor",instructorSchema)
    mongoose.model("Category",categorySchema)
    mongoose.model("Admin",adminSchema)
    mongoose.model("Course",courseSchema)
    mongoose.model(`${config.get("bucketName")}.files`,fileSchema)


    const mongoUrl = config.get("dbUrl")

    mongoose.connect(mongoUrl,{useUnifiedTopology: true, useNewUrlParser: true},()=>{
        winston.info(`Connected to ${mongoUrl}`)
    })
}