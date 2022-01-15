const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/keyword', checkUser, require('./keywordCreatePOST'));
router.get('/keyword', checkUser, require('./keywordListGET'));

module.exports = router;
