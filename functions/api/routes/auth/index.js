const express = require('express');
const router = express.Router();

router.use('/login', require('./authLoginPOST'));
router.use('/register', require('./authRegisterPOST'));

module.exports = router;
