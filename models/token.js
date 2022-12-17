
const mongoose = require("mongoose")
const config = require("config")

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt:{
        type:Date,
        expires: config.get("tokenExpireSeconds"),
        default: Date.now
    }
})

module.exports = {tokenSchema}