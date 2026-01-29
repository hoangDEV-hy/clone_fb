import express from "express"
import multer from "multer";
let router = express.Router();
//for creating file in a disk
const storage: any = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'upload/others'; // mặc định
        if (file.fieldname === 'img') folder = 'upload/images';
        if (file.fieldname === 'audio') folder = 'upload/voices';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
})
//for reading files
const upload = multer({ storage });
const uploadMiddleware = upload.fields([
    { name: 'img' },
    { name: 'audio' }
])
router.post('/data', uploadMiddleware, (req: any, res: any): void => {
    const file = req.files;
    let resuilt: any = {};
    if (file.img) resuilt.imgUrl = `/upload/images/${file.img[0].filename}`;
    if (file.audio) resuilt.voiceUrl = `/upload/voices/${file.audio[0].filename}`;
    return res.json(resuilt)
})

export { router }