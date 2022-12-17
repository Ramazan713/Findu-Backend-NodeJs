const express = require("express")
const mongoose = require("mongoose")
const { validateSignInAdmin, validateSignUpAdmin } = require("../models/admin")

const router = express.Router()

const Admin = mongoose.model("Admin")


router.post("/signin",async(req,res)=>{
    const {error,value} = validateSignInAdmin.validate(req.body)
    if(error)return res.status(400).send(error.message)

    const admin = await Admin.findOne({email:value.email})
    if(!admin)return res.status(404).send("email or password is wrong")

    if(!await admin.comparePassword(value.password)){
        return res.status(404).send("email or password is wrong")
    }
    const token = admin.generateAuthToken()
    res.send({token})
})

router.post("/signup",async(req,res)=>{
    const {error,value} = validateSignUpAdmin.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(await Admin.findOne({email:value.email})){
        return res.status(400).send("email adress is already used")
    }

    const admin = new Admin({...value})
    await admin.save()
    const token = admin.generateAuthToken()
    res.send({token})
})


module.exports = router