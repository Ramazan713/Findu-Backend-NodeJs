const Joi = require("joi")
const mongoose = require("mongoose")


const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        minlength:2,
        maxlength:39,
        required:true
    }
})


const validateCategory = Joi.object({
    name: Joi.string().min(2).max(39).required()
})

module.exports = {categorySchema,validateCategory}