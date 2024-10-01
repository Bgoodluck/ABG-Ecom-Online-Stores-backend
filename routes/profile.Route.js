import express from 'express'
import { getProfile, updateProfile, fetchProfile } from '../controllers/profileController.js'
// import { upload2 } from '../middleware/uploadImage.js';
// import upload from '../middleware/multer.js';
import authUser from '../middleware/auth.js'
import multer from 'multer'

const profileRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload2 = multer({storage:storage})


profileRouter.get('/create',upload2.single('image'),authUser, getProfile);
profileRouter.post('/update',upload2.single('image'),authUser, updateProfile);
profileRouter.get('/get',authUser, fetchProfile);


export default profileRouter;