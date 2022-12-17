const express = require("express")
const { default: mongoose } = require("mongoose")
const UserLevels = require("../constants/user_levels")

const useUserAuth = require("../middleware/useUserAuth")
const useUserType = require("../middleware/useUserType")
const { validatePatchUser, validateUpdateUser, validatePassword } = require("../models/User")
const {sendVerificationEmail} = require("../services/user_email_service")
const gridfs_bucket = require("../storage/gridfs_bucket")
const _ = require("lodash")
const useValidateObjectId = require("../middleware/useValidateObjectId")

const User = mongoose.model("User")
const Token = mongoose.model("Token")
const Instructor = mongoose.model("Instructor")
const Course = mongoose.model("Course")

const router = express.Router()

router.get("/me",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id).select("-password")
    if(!user)return res.status(404).send("user not found")

    res.send(user)
})

router.patch("/",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id).select("-password")
    if(!user)return res.status(404).send("user not found")

    const {error,value}=validatePatchUser.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(value.email&&await User.findOne({email:value.email, _id: {$ne: user._id}})){
        return res.status(400).send("email address is already used")
    }
    if(value.username&&await User.findOne({username:value.username, _id: {$ne: user._id}})){
        return res.status(400).send("username is already used")
    }

    const result=await User.findByIdAndUpdate(user._id,{...value},{new:true}).select("-password")
    res.send(result)
})

router.put("/",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id)
    if(!user)return res.status(404).send("user not found")

    const {error,value} = validateUpdateUser.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(await User.findOne({email:value.email, _id: {$ne: user._id}})){
        return res.status(400).send("email address is already used")
    }
    if(await User.findOne({username:value.username, _id: {$ne: user._id}})){
        return res.status(400).send("username is already used")
    }

    const updatedValues = {
        ...value,
        ..._.pick(user,["isVerified","password"])
    }

    const result=await User.findOneAndReplace({_id:user._id},updatedValues,{new:true}).select("-password")
    res.send(result)
})

router.post("/changePassword",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id)
    if(!user)return res.status(404).send("user not found")

    const {error,value} = validatePassword.validate(req.body)
    if(error)return res.status(400).send(error.message)

    const comparePassword = await user.comparePassword(value.oldPassword)
    if(!comparePassword){
        return res.status(400).send("wrong password")
    }
    user.password=value.newPassword
    await user.save()
    res.send({message:"successfully changed password"})
    
})


router.post("/sendVerificationToken",useUserAuth,async(req,res)=>{
    const user = await User.findById(req.user.id)
    if(!user)return res.status(404).send("user not found")

    if(user.isVerified) return res.status(400).send("user has already verified")

    await sendVerificationEmail(user)

    res.send("An Email sent to your account please verify");
})

router.get("/verify/:id/:token", async (req, res,next) => {
    const user = await User.findById(req.params.id)
    if(!user)return res.status(404).send("user not found")

    const token = await Token.findOne({
        userId: user._id,
        token: req.params.token,
    });
    if (!token) return res.status(404).send("Invalid link");

    user.isVerified = true
    await user.save()
    await token.remove()

    res.send("email verified sucessfully");
});

router.delete("/:id",useValidateObjectId(),useUserType(UserLevels.admin,UserLevels.user),async(req,res)=>{
    const userId = req.params.id

    if(req.userType.userLevel === UserLevels.user&&
        req.userType.id!==userId){
        return res.status(403).send("access denied")
    }


    const user = await User.findById(userId)
    if(!user)return res.status(404).send("user not found")
    await user.remove()
    
    const deletedInstructor=await Instructor.findOneAndDelete({userId})

    if(deletedInstructor!=null){
        const coursePhotos = await Course.find({instructorId: deletedInstructor._id}).select("photoId")
        await Course.deleteMany({instructorId: deletedInstructor._id})
        await deletePhotoId(deletedInstructor.photoId)
        
        coursePhotos.forEach(async(coursePhoto)=>{
            await deletePhotoId(coursePhoto.photoId)
        })
    }
    res.send(user)
})



async function deletePhotoId(oldPhotoId){
    try{
        await gridfs_bucket.delete(oldPhotoId)
    }catch(e){}
}

module.exports = router