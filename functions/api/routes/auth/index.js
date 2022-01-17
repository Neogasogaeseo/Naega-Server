const express = require('express');
const router = express.Router();
const uploadImage = require('../../../middlewares/uploadImage');

router.post('/login', require('./authLoginPOST'));
router.post('/register', uploadImage, require('./authRegisterPOST'));

module.exports = router;
