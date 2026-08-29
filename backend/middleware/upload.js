const multer = require('multer')
const path = require('path')

// where to saev the file
const storage = multer.diskStorage({
    // where to save the imagee
    destination: (req, file, cb) => {
        cb(null,'uploads/')
    },
    // what will be the name of the file
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({storage: storage})

module.exports = upload;