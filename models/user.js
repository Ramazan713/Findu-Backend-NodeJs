const mongoose = require("mongoose")
const Joi = require('joi');
const config = require("config")
const jwt = require("jsonwebtoken");
const { generateHashPassword } = require("../utils");
const bcrypt = require("bcrypt")
const UserLevels = require("../constants/user_levels")
const uuid = require("uuid");



const userSchema = new mongoose.Schema({
    name:{
        type:String,
        trim:true,
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
    username:{
        type:String,
        minlength:3,
        maxlength:50,
        trim:true,
        unique:true,
        required:true
    },
    password:{
        type:String,
        minlength:5,
        maxlength:1024,
        required:true
    },
    surname:{
        type:String,
        minlength:3,
        maxlength:50,
        trim:true
    },
    phone:{
        type:String,
        trim:true,
        minlength:7,
        maxlength:13
    },
    city:{
        type:String,
        minlength:2,
        maxlength:50
    },
    country:{
        type:String,
        minlength:2,
        maxlength:50
    },
    isVerified:{
        type:Boolean,
        default:false
    }

})




userSchema.pre("save",async function(next){
    this.password = await generateHashPassword(this.password)
    next()
})

userSchema.pre("findOneAndUpdate",async function(next){
    if(this._update.password){        
        const hashedPassword = await generateHashPassword(this._update.password)
        this.set({password:hashedPassword})
    }
    next()
})


userSchema.methods.comparePassword = async function(otherPassword){
    return await bcrypt.compare(otherPassword,this.password)
}

userSchema.methods.generateAuthToken = function(){
    return jwt.sign({id:this._id,userLevel:UserLevels.user},config.get("jwtPrivateKey"))
}

userSchema.methods.generateVerificationToken = function(){
    return uuid.v4()
}


const validateSignUpUser = Joi.object({
    username: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().min(7).max(50).email().required(),
    password: Joi.string().min(5).max(30).required()
})

const validateSignInUser = Joi.object({
    username: Joi.string().trim().min(3).max(50).allow(''),
    email: Joi.when('username',{is: Joi.exist(),then:Joi.string(),
        otherwise: Joi.string().trim().min(7).max(50).email().required()}),
    password: Joi.string().min(5).max(30).required()
})

const validatePatchUser = Joi.object({
    username: Joi.string().trim().min(3).max(50),
    email: Joi.string().trim().min(7).max(50).email(),
    name: Joi.string().trim().min(3).max(50),
    surname: Joi.string().trim().min(3).max(50),
    phone: Joi.string().trim().min(7).max(13),
    city: Joi.string().trim().min(2).max(50),
    country: Joi.string().trim().min(2).max(50),
})

const validateUpdateUser = Joi.object({
    username: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().min(7).max(50).email().required(),
    name: Joi.string().trim().min(3).max(50),
    surname: Joi.string().trim().min(3).max(50),
    phone: Joi.string().trim().min(7).max(13),
    city: Joi.string().trim().min(2).max(50),
    country: Joi.string().trim().min(2).max(50),
})

const validatePassword  = Joi.object({
    oldPassword:Joi.string().min(5).max(30).required(),
    newPassword: Joi.string().min(5).max(30).required()
})


module.exports = {userSchema,validateSignUpUser,validateSignInUser,validatePatchUser,validateUpdateUser,validatePassword}

