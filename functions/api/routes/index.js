const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/team', require('./team'));
router.use('/form', require('./form'));
router.use('/report', require('./report'));

module.exports = router;
