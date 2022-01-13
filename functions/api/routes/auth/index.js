const express = require('express');
const router = express.Router();

router.post('/login', require('./authLoginPOST'));
router.post('/register', require('./authRegisterPOST'));

module.exports = router;
