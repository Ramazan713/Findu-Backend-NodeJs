const express = require("express")
const { default: mongoose } = require("mongoose")
const useInstructorAuth = require("../middleware/useInstructorAuth")
const {validateSignInUser,validateSignUpUser } = require("../models/user")
const { sendVerificationEmail } = require("../services/user_email_service")


const router = express.Router()
const User = mongoose.model("User")
const Instructor = mongoose.model("Instructor")


router.post("/signup",async(req,res,next)=>{
    
    const { error, value } = validateSignUpUser.validate(req.body)
    if(error){
        return res.status(400).send(error.message)
    }
    let user = await User.findOne({email:value.email})
    if(user){
        return res.status(400).send("This email address already used")
    }
    let instructor = await Instructor.findOne({email:value.email})
    if(instructor){
        return res.status(400).send("This email address already used")
    }

    user = await User.findOne({username:value.username})
    if(user){
        return res.status(400).send("This username address already used")
    }

    const newUser = new User({...value})
    await newUser.save()
    const token = newUser.generateAuthToken()
    
    sendVerificationEmail(newUser)
    res.send({token,message:"An Email sent to your account please verify"})
})


router.post("/signin",async(req,res)=>{
    const { error, value:{email,password,username} } = validateSignInUser.validate(req.body)
    if(error){
        return res.status(400).send(error.message)
    }
    let user
    if(username){
        user = await User.findOne({username})
        if(!user){
            return res.status(404).send("username or password wrong")
        }
    }else{
        user = await User.findOne({email})
        if(!user){
            return res.status(404).send("email or password wrong")
        }
       
    }

    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect){
        return res.status(404).send("email or password wrong")
    }

    const token = user.generateAuthToken()
    res.send({token})
})

router.post("/switchToUser",useInstructorAuth,async(req,res)=>{

    if(!await Instructor.findById(req.instructor.id)){
        return res.status(404).send("instructor not found")
    }

    const user = await User.findById(req.instructor.userId)
    if(!user)return res.status(404).send("user not found")

    const token = user.generateAuthToken()
    res.send({token})
})


module.exports = router;