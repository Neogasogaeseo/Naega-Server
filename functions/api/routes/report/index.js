const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');
const uploadImage = require('../../../middlewares/uploadImage');

router.get('/:reportKind', require('./reportCategoryGET'));
router.post('/', checkUser, uploadImage('report'), require('./reportPOST'));

module.exports = router;
