const mongoose = require("mongoose")
const express = require("express")
const { validateComment } = require("../models/instructor_comment")
const useUserAuth = require("../middleware/useUserAuth")

const Instructor = mongoose.model("Instructor")
const _ = require("lodash")
const User = mongoose.model("User")

const router = express.Router()
router.use(useUserAuth)


router.post("/",async(req,res)=>{
    const {error,value} = validateComment.validate(req.body)
    if(error)return res.status(400).send(error.message)
    
    const userId = req.user.id
    if(!await User.findById(userId)){
        return res.status(404).send("user not found")
    }

    const instructor = await Instructor.findById(value.instructorId)
    if(!instructor){
        return res.status(404).send("instructor not found")
    }

    for(var comment of instructor.comments){
        if(comment.userId == userId)
            return res.status(400).send("user has already commented this instructor")
    }

    const instructorComment = {
        userId,...value
    }
    
    instructor.comments.push(instructorComment)
    await instructor.save()

    res.status(201).send(instructorComment)
})

router.put("/",async(req,res,next)=>{
    const {error,value} = validateComment.validate(req.body)
    if(error)return res.status(400).send(error.message)

    const userId = req.user.id

    if(!await User.findById(userId)){
        return res.status(404).send("user not found")
    }

    const instructor = await Instructor.findById(value.instructorId)
    if(!instructor) return res.status(404).send("instructor not found")

    try{
        const resultComment={...value,userId}
        const result=await Instructor.findOneAndUpdate({"comments.instructorId":instructor._id,"comments.userId":userId},{
            $set:{"comments.$":resultComment}},{new:true})
        if(result!=null) return res.send(resultComment)
        res.status(404).send("not found for any comment for this instructor with given user")
    }catch(e){
        next(e)
    }
})

router.delete("/:instructorId",async(req,res,next)=>{

    const userId = req.user.id

    if(!await User.findById(userId)){
        return res.status(404).send("user not found")
    }

    const instructor = await Instructor.findById(req.params.instructorId)
    if(!instructor) return res.status(404).send("instructor not found")

    const comments=instructor.comments
    for(const index in comments){
        if(comments[index].userId.toString()===userId){
            const deleted = comments[index]
            comments.splice(index,1)
            await instructor.save()
            return res.send(deleted)
        }
    }
    res.status(404).send("not found")
})

module.exports=router


