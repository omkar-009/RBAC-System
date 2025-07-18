const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error('Only .jpg, .jpeg and .png format allowed!'), false);
    }
    cb(null, true);
  }
});

router.use(auth.authenticate);
router.use(auth.authorizeAdmin);

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getDashboard);
router.get('/users/create', adminController.getCreateUser);
router.post('/users', adminController.postCreateUser);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', upload.single('photo'), adminController.postEditUser);

router.delete('/users/:id', adminController.deleteUser);

router.get('/users/delete/:id', adminController.getDeleteUser);

router.patch('/users/:id/status', adminController.toggleUserStatus);

router.get('/create-user', adminController.getCreateUser);
router.post('/create-user', adminController.postCreateUser);
router.get('/edit-user/:id', adminController.getEditUser);
router.post('/edit-user/:id', upload.single('photo'), adminController.postEditUser);
router.get('/delete-user/:id', adminController.getDeleteUser);

module.exports = router;
