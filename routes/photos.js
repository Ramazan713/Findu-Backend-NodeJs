
const exporess = require("express")
const { default: mongoose } = require("mongoose")
const gridfsBucket = require("../storage/gridfs_bucket")

const router = exporess.Router()

router.get("/:id",async(req,res,next)=>{
    const id = req.params.id
    try{
        const photos = await gridfsBucket.find({_id:mongoose.Types.ObjectId(id)}).toArray()
        if(photos.length==0){
            return res.status(404).send("not found")
        }
        const photo = photos[0]
        const readStream=gridfsBucket.openDownloadStream(photo._id)
        readStream.pipe(res)
    }catch(e){
        next(e)
    }
})


module.exports = router
