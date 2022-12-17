const config = require("config")
const { GridFsStorage  } = require("multer-gridfs-storage");
const sharp = require("sharp")

module.exports = new GridFsStorage({
    url: config.get("dbUrl"),
    cache: 'connections',
    options: { useUnifiedTopology: true }, 
    file: (req, file) => {    
        return new Promise((resolve, reject) => {
            const filename = file.originalname;
            const fileInfo = {
                filename: filename,
                bucketName: config.get("bucketName")
            };
            resolve(fileInfo);
        });
     }
});
