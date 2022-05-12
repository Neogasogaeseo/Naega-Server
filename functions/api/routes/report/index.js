const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/:reportKind', require('./reportCategoryGET'));
// router.post('/answer',checkUser, require('./formAnswerCreatePOST'));

module.exports = router;
