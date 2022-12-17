const mongoose = require("mongoose")
const express = require("express")
const useInstructorAuth = require("../middleware/useInstructorAuth")
const { validateCourse, validateCoursePatch } = require("../models/course")
const _ = require("lodash")
const useUserType = require("../middleware/useUserType")
const UserLevels = require("../constants/user_levels")
const useUpload = require("../middleware/useUpload")
const gridfs_bucket = require("../storage/gridfs_bucket")
const useSelectParams = require("../middleware/useSelectParams")
const SelectParam = require("../custom_models/select_param")

const Course = mongoose.model("Course")
const Instructor = mongoose.model("Instructor")
const Category = mongoose.model("Category")

const router = express.Router()


router.get("/",useUserType(...UserLevels.values()),
    useSelectParams(new SelectParam("city",true),new SelectParam("country",true),new SelectParam("name",true),
    "instructorId","catId","lessonType"),async(req,res)=>{

    const searchParams = {...req.fields,isApproved:true,activeUntil:{$gt:Date.now()}}
    if(req.query["isApproved"] !== undefined &&  req.userType.userLevel===UserLevels.admin){
        searchParams["isApproved"] = req.query["isApproved"]
    }
    const result = await Course.find(searchParams)
    
    res.send(result)
})

router.get("/:id", async(req,res)=>{
    const course = await Course.findOne({_id:req.params.id,isApproved:true,activeUntil:{$gt:Date.now()}})
    if(!course)return res.status(404).send("Course not found")
    res.send(course)
})

router.post("/",useInstructorAuth,useUpload.single("photo"),async(req,res)=>{
    const {error,value} = validateCourse.validate(req.body)
    if(error)return res.status(400).send(error.message)

    const instructorId = req.instructor.id
    if(!await Instructor.findById(instructorId))
        return res.status(404).send("instructor not found for adding course")
    
    if(!await Category.findById(value.catId))
        return res.status(404).send("Category not found for adding course")

    const newValues = {...value,instructorId}    
    if(req.file){
        newValues["photoId"]=req.file.id
    }
    const course = new Course(newValues)
    await course.save()
    res.send(course)
})

router.put("/:id",useInstructorAuth,useUpload.single("photo"),async(req,res)=>{
    const {error,value} = validateCourse.validate(req.body)
    
    if(error)return res.status(400).send(error.message)

    if(value.catId && !await Category.findById(value.catId))
        return res.status(404).send("Category not found for adding course")

    const id = req.params.id
   
    const course = await Course.findById(id)

    if(!course)return res.status(404).send("Course not found")

    if(course.instructorId.toString()!==req.instructor.id.toString()){
        return res.status(403).send("Access Denied")
    }

    if(!await Instructor.findById(course.instructorId))
        return res.status(404).send("Instructor not found for adding course")


    const updateFields = {
        ...value,
        ..._.pick(course,["isApproved","createdAt","instructorId"]),
    }
    if(req.file){
        updateFields["photoId"]=req.file.id
    }
    await deletePhotoId(course.photoId)

    const result = await Course.findOneAndReplace({_id:id},{...updateFields},{new:true})
    res.send(result)
})

router.patch("/:id",useInstructorAuth,useUpload.single("photo"),async(req,res)=>{
    const {error,value} = validateCoursePatch.validate(req.body)
    if(error)return res.status(400).send(error.message)

    if(value.catId && !await Category.findById(value.catId))
        return res.status(404).send("Category not found")

    const id = req.params.id
    const course = await Course.findById(id)
    if(!course)return res.status(404).send("course not found")

    if(!await Instructor.findById(course.instructorId))
        return res.status(404).send("Instructor not found")

    if(course.instructorId.toString()!==req.instructor.id.toString()){
        return res.status(403).send("Access Denied")
    }

    const newValues = {...value}
    
    if(req.file){
        newValues["photoId"]=req.file.id
        await deletePhotoId(course.photoId)
    }

    const result = await Course.findOneAndUpdate(id,newValues,{new:true,})
    res.send(result)
})


router.delete("/:id",useUserType(UserLevels.admin,UserLevels.instructor),async(req,res)=>{
    const course = await Course.findById(req.params.id)
    if(!course) return res.status(404).send("course not found")

    if(req.userType.userLevel===UserLevels.instructor&&
        course.instructorId.toString() !== req.userType.id){        
        return res.status(403).send("Access Denied")
    }
    if(course.photoId){
        await deletePhotoId(course.photoId)
    }

    const result = await Course.findByIdAndRemove(req.params.id)
    res.send(result)
})

async function deletePhotoId(oldPhotoId){
    try{
        await gridfs_bucket.delete(oldPhotoId)
    }catch(e){}
}

module.exports = router


