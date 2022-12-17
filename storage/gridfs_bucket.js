
const mongoose = require("mongoose")
const config = require("config")

module.exports = new mongoose.mongo.GridFSBucket(mongoose.connection, {
    bucketName: config.get("bucketName"),
})