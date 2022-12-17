const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");
const { generateHashPassword } = require("../utils");
const bcrypt = require("bcrypt")
const UserLevels = require("../constants/user_levels")
const Joi = require('joi');
const config = require("config")


const adminSchema = new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        minlength:3,
        maxlength:50
    },
    surname:{
        type:String,
        minlength:3,
        maxlength:50,
        trim:true
    },
    email:{
        type:String,
        minlength:7,
        maxlength:50,
        required:true,
        unique:true,
        trim:true
    },
    phone:{
        type:String,
        trim:true,
        minlength:7,
        maxlength:13
    },
    password:{
        type:String,
        minlength:5,
        maxlength:1024,
        required:true
    },
    isSuperAdmin:{
        type: Boolean,
        default: false
    }
})

adminSchema.methods.comparePassword = function(otherPassword){
    return bcrypt.compare(otherPassword,this.password)
}

adminSchema.methods.generateAuthToken = function(){
    return jwt.sign({id:this._id,userLevel:UserLevels.admin},config.get("jwtPrivateKey"))
}


adminSchema.pre("save",async function(next){
    this.password = await generateHashPassword(this.password)
    next()
})

adminSchema.pre("findOneAndUpdate",async function(next){
    if(this._update.password){        
        const hashedPassword = await generateHashPassword(this._update.password)
        this.set({password:hashedPassword})
    }
    next()
})

const validateSignInAdmin = Joi.object({
    email: Joi.string().trim().min(7).max(50).email().required(),
    password: Joi.string().min(5).max(30).required()
})

const validateSignUpAdmin = Joi.object({
    email: Joi.string().trim().min(7).max(50).email().required(),
    password: Joi.string().min(5).max(30).required(),
    name: Joi.string().trim().min(3).max(50),
    surname: Joi.string().trim().min(3).max(50),
    phone: Joi.string().trim().min(7).max(13),
})

const validateUpdateAdmin = Joi.object({
    email: Joi.string().trim().min(7).max(50).email(),
    password: Joi.string().min(5).max(30),
    name: Joi.string().trim().min(3).max(50),
    surname: Joi.string().trim().min(3).max(50),
    phone: Joi.string().trim().min(7).max(13),
})

module.exports = {adminSchema,validateSignInAdmin,validateSignUpAdmin}

