const express = require("express")
const mongoose = require("mongoose")

const Category = mongoose.model("Category")

const router = express.Router()

router.get("/",async(req,res)=>{
    const categories = await Category.find()
    res.send(categories)
})


module.exports = router

