import multer from 'multer';



const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});


const upload2 = multer({ storage: diskStorage });


export { upload2 };
