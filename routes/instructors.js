const mongoose = require("mongoose")
const express = require("express")
const useInstructorAuth = require("../middleware/useInstructorAuth")
const { validateUpdateInstructor, validatePatchInstructor } = require("../models/instructor")
const gridfs_bucket = require("../storage/gridfs_bucket")
const useUpload = require("../middleware/useUpload")
const _ = require("lodash")
const useUserType = require("../middleware/useUserType")
const UserLevels = require("../constants/user_levels")
const useSelectParams = require("../middleware/useSelectParams")
const useValidateObjectId = require("../middleware/useValidateObjectId")
const SelectParam = require("../custom_models/select_param")

const Instructor = mongoose.model("Instructor")
const Course = mongoose.model("Course")

const router = express.Router()


router.get("/",useSelectParams(new SelectParam("occupation",true),new SelectParam("name",true)),async(req,res)=>{
    const instructors = await Instructor.find({...req.fields}).select("-comments")

    res.send(instructors)
})


router.get("/me",useInstructorAuth,async(req,res)=>{
    const instructor = await Instructor.findById(req.instructor.id)
    if(!instructor)return res.status(404).send("instructor not found")
   
    res.send(instructor.toJSON({virtuals:true}))
})

router.get("/:id",useValidateObjectId(),async(req,res)=>{
    const instructor = await Instructor.findById(req.params.id)
    if(!instructor)return res.status(404).send("instructor not found")
    
    res.send(instructor.toJSON({virtuals:true}))
})


router.put("/",useInstructorAuth,useUpload.single("photo"),async(req,res,next)=>{
    const instructor = await Instructor.findById(req.instructor.id)
    if(!instructor)return res.status(404).send("instructor not found")

    const {error,value} = validateUpdateInstructor.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(await Instructor.findOne({email:value.email,_id:{$ne: instructor._id}})){
        return res.status(400).send("email address is already used")
    }
    const newValues = {
        ...value,
        ..._.pick(instructor,["comments","userId"])
    }
   
    if(req.file){
        newValues["photoId"]=req.file.id
    }
    await deletePhotoId(instructor.photoId)
    const result = await Instructor.findOneAndReplace({_id: instructor._id},newValues,{new:true})
    res.send(result)
})


router.patch("/",useInstructorAuth,useUpload.single("photo"),async(req,res,next)=>{
    
    const instructor = await Instructor.findById(req.instructor.id)
    if(!instructor)return res.status(404).send("instructor not found")

    const {error,value} = validatePatchInstructor.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(value.email&&await Instructor.findOne({email:value.email})){
        return res.status(400).send("email address is already used")
    }
    const newValues = {...value}
    if(req.file){
        newValues["photoId"]=req.file.id
        await deletePhotoId(instructor.photoId)
    }
    const result=await Instructor.findByIdAndUpdate(instructor._id,newValues,{new:true})
    res.send(result)
})

router.delete("/:id",useUserType(UserLevels.admin,UserLevels.instructor),async(req,res)=>{
    const instructorId = req.params.id

    if(req.userType.userLevel === UserLevels.instructor&&
        req.userType.id!==instructorId){
        return res.status(403).send("access denied")
    }

    const instructor=await Instructor.findById(instructorId)
    if(!instructor)return res.status(404).send("instructor not found")
    await instructor.remove()

    const coursePhotos = await Course.find({instructorId}).select("photoId")
    await Course.deleteMany({instructorId})

    await deletePhotoId(instructor.photoId)
   
    coursePhotos.forEach(async(coursePhoto)=>{
        await deletePhotoId(coursePhoto.photoId)
    })
    res.send(instructor)
})


async function deletePhotoId(oldPhotoId){
    try{
        await gridfs_bucket.delete(oldPhotoId)
    }catch(e){}
}

module.exports=router