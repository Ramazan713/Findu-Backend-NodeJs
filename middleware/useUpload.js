const multer = require("multer");
const gridfs_storage = require("../storage/gridfs_storage");



module.exports = multer({
    limits:{
        fileSize: 7*1024*1024
    },
    storage:gridfs_storage,
    fileFilter: function(req, file, callback) {
        let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length-1]).toLowerCase(); // convert extension to lower case
        if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
          return callback('Wrong file type', false);
        }
        file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
        callback(null, true);
      },
})

