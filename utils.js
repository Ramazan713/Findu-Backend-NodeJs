
const bcrypt = require("bcrypt")
const sharp = require("sharp")
const gridfs_storage = require("./storage/gridfs_storage")
const { Readable } = require("stream"); // from nodejs

async function generateHashPassword(password){
    const salt = await bcrypt.genSalt(13)
    const hashPassword = await bcrypt.hash(password,salt)
    return hashPassword
}

async function compressAndStoreImg(req,cb){
    const file=req.file
    const buffer = file.buffer
    if(file.size<1024*100){//100kb
        gridfs_storage.fromStream(Readable.from(buffer),req,file).then(async(value)=>{
            await cb(value)
        })
    }else{
        
        sharp(buffer).resize(720).toBuffer((err,buffer,info)=>{
            const fileStream = Readable.from(buffer)
            gridfs_storage.fromStream(fileStream,req,file).then(async(value)=>{
               await cb(value)
            })
        })
    }

    
}

module.exports = {generateHashPassword,compressAndStoreImg}