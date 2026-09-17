const multer = require('multer');
const path = require('path');

function imageFilter(req, file, cb) {
    const mime_type = file.mimetype.split('/')[0];
    if (mime_type === 'image') {
        cb(null, true)
    } else {
        req.fileTypeError = true;
        cb(null, false)
    }
}

function pdfFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        req.fileTypeError = true;
        cb(null, false)
    }
}

const file_storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    },
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'uploads/images'))
    }
})

module.exports = function (filterType) {
    const MAP_FILTER = {
        image: imageFilter,
        pdf: pdfFilter
    }
    const upload = multer({
        storage: file_storage,
        fileFilter: MAP_FILTER[filterType],
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB
        }
    })
    return upload;
}
