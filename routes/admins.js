
const express = require("express")
const useAdminAuth = require("../middleware/useAdminAuth")
const mongoose = require("mongoose")

const router = express.Router()
router.use(useAdminAuth)

const Admin = mongoose.model("Admin")
const Course = mongoose.model("Course")


router.post("/approveCourse/:courseId",async(req,res)=>{
    if(!await Admin.findById(req.admin.id)){
        return res.status(404).send("admin not found")
    }
    const courseId=req.params.courseId
    const course = await Course.findById(courseId)

    if(!course)return res.status(404).send("course not found")

    course.isApproved=true
    await course.save()
    res.send(course)
})

router.post("/disApproveCourse/:courseId",async(req,res)=>{
    if(!await Admin.findById(req.admin.id)){
        return res.status(404).send("admin not found")
    }
    const courseId=req.params.courseId
    const course = await Course.findById(courseId)

    if(!course)return res.status(404).send("course not found")

    course.isApproved=false
    await course.save()
    res.send(course)
})


module.exports = router