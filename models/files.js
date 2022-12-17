const mongoose = require("mongoose")


const fileSchema = new mongoose.Schema({
    length:Number,
    chunckSize:Number,
    uploadDate: {
        type:Date,
        default: Date.now()
    },
    fileName:String,
    contentType:String
})

module.exports = {fileSchema}
