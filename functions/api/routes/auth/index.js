const express = require('express');
const router = express.Router();
const uploadImage = require('../../../middlewares/uploadImage');
const { checkUser } = require('../../../middlewares/auth');

router.post('/login', require('./authLoginPOST'));
router.post('/register', checkUser, uploadImage('user'), require('./authRegisterPOST'));

module.exports = router;
