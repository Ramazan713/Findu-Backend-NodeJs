const mongoose = require("mongoose")
const Joi = require('joi');


const courseSchema = new mongoose.Schema({
    instructorId:{
        type: mongoose.Types.ObjectId,
        required:true,
        ref:"Instructor"
    },
    catId:{
        type: mongoose.Types.ObjectId,
        required:true,
        ref:"Category"
    },
    photoId:{
        type: mongoose.Types.ObjectId
    },
    name:{
        type:String,
        trim:true,
        minlength:1,
        maxlength:50,
        required:true
    },
    city:{
        type:String,
        minlength:2,
        maxlength:50,
        required: function(){
            return this.lessonType !== "online"
        }
    },
    country:{
        type:String,
        minlength:2,
        maxlength:50,
        required: function(){
            return this.lessonType !== "online"
        }
    },
    price:{
        type:Number,
        min:0,
        max: 10000,
        required:true
    },
    isApproved:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default: Date.now()
    },
    activeUntil:{
        type:Date,
        required:true
    },
    lessonType:{
        type: String,
        enum: ["inPerson","online"],
        required:true
    }
})


const validateCourse = Joi.object({
    catId: Joi.objectId().required(),
    lessonType: Joi.string().valid("inPerson","online").required(),
    photo: Joi.any(),
    name: Joi.string().min(1).max(50).required(),
    price: Joi.number().min(0).max(10000).required(),
    activeUntil: Joi.date().required(),
    city: Joi.string().min(2).max(50).when('lessonType',{not: 'online',then:Joi.required()}),
    country: Joi.string().min(2).max(50).when('lessonType',{not: 'online',then:Joi.required()}),
})

const validateCoursePatch = Joi.object({
    catId: Joi.objectId(),
    lessonType: Joi.string().valid("inPerson","online"),
    photo: Joi.any(),
    name: Joi.string().min(3).max(50),
    price: Joi.number().min(0).max(10000),
    activeUntil: Joi.date(),
    city: Joi.string().min(2).max(50).when('lessonType',{not: 'online',then:Joi.required()}),
    country: Joi.string().min(2).max(50).when('lessonType',{not: 'online',then:Joi.required()}),
})



module.exports = {courseSchema,validateCourse,validateCoursePatch}

