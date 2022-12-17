
const mongoose = require("mongoose")
const { instructorCommentSchema } = require("./instructor_comment")
const jwt = require("jsonwebtoken")
const config = require("config")
const Joi = require("joi")
const UserLevels = require("../constants/user_levels")

const instructorSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"User"
    },
    name:{
        type:String,
        minlength:3,
        maxlength:50
    },
    surname:{
        type:String,
        minlength:3,
        maxlength:50
    },
    email:{
        type:String,
        minlength:7,
        maxlength:50,
        required:true,
        unique:true,
        trim:true
    },
    occupation:{
        type:String,
        minlength:3,
        maxlength:100
    },
    introText:{
        type:String,
        minlength:3,
        maxlength:10000
    },
    comments:{
        type:[instructorCommentSchema],
        default:[]
    },
    photoId:{
        type:mongoose.Types.ObjectId
    },
    
},{
    virtuals:{
        ratings:{
            get(){
                if(this.comments===undefined||this.comments.length===0) return null
                const ratings=this.comments.filter(e=>e.rating!=null).map(e=>e.rating)
                return ratings.reduce((a,b)=>a+b)/ratings.length
            }
        },
        ratingCounts:{
            get(){
                if(this.comments===undefined||this.comments.length===0) return 0
                const ratingsLength=this.comments.filter(e=>e.rating!=null).length
                return ratingsLength
            }
        }
    },
   
})

instructorSchema.methods.generateAuthToken = function(){
    return jwt.sign({id: this._id,userId:this.userId,userLevel:UserLevels.instructor},config.get("jwtPrivateKey"))
}

const validatePatchInstructor = Joi.object({
    name: Joi.string().min(3).max(50),
    surname: Joi.string().min(3).max(50),
    email: Joi.string().min(7).max(50).email(),
    occupation: Joi.string().min(3).max(100),
    introText: Joi.string().min(3).max(10000),
    photo: Joi.any()
})

const validateUpdateInstructor = Joi.object({
    name: Joi.string().min(3).max(50),
    surname: Joi.string().min(3).max(50),
    email: Joi.string().email().min(7).max(50).required(),
    occupation: Joi.string().min(3).max(100),
    introText: Joi.string().min(3).max(10000),
    photo: Joi.any()
})


module.exports = {instructorSchema,validateUpdateInstructor,validatePatchInstructor}


