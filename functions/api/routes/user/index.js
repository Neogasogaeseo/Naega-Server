const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/keyword',checkUser, require('./keywordCreatePOST'));


module.exports = router;
