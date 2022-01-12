const express = require('express');
const router = express.Router();

router.use('/login', require('./authLoginPOST'));
router.use('/signup', require('./authSignUpPOST'));

module.exports = router;
