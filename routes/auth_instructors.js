const mongoose = require("mongoose")
const express = require("express")
const useUserAuth = require("../middleware/useUserAuth")

const router = express.Router()
const User = mongoose.model("User")
const Instructor = mongoose.model("Instructor")


router.post("/switchToInstructor",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id)
    if(!user)return res.status(404).send("user not found")

    let instructor = await Instructor.findOne({userId:user._id})
    if(instructor){
        return res.send({token:instructor.generateAuthToken()})
    }

    instructor = new Instructor({
        userId: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email
    })
    await instructor.save()
    res.send({token: instructor.generateAuthToken()})
})





module.exports=router