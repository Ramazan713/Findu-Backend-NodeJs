
const mongoose = require("mongoose")
const Joi = require("joi")

const instructorCommentSchema=new mongoose.Schema({
    instructorId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"Instructor"
    },
    userId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"User"
    },
    message:{
        type:String,
        trim:true,
        minlength:3,
        maxlength:1024
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        required:true,
        default:Date.now()
    }
})


const validateComment = Joi.object({
    instructorId: Joi.objectId().required(),
    message: Joi.string().min(3).max(1024),
    rating: Joi.number().min(1).max(5)
})


module.exports={instructorCommentSchema,validateComment}
