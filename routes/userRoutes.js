const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only .jpg, .jpeg and .png format allowed!'));
        }
        cb(null, true);
    }
});

router.get('/register', userController.getRegister);
router.post('/register', userController.postRegister);
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);

router.use(auth.authenticate);
router.get('/dashboard', userController.getDashboard);
router.get('/profile', userController.getProfile);
router.post('/profile', upload.single('photo'), userController.updateProfile);
router.get('/logout', userController.getLogout);

module.exports = router;
