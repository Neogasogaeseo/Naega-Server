const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/template/popular', checkUser, require('./formTemplatePopularGET'));
router.get('/template/recent', checkUser, require('./formTemplateRecentGET'));
router.get('/create/:formId', checkUser, require('./formCreateGET'));

module.exports = router;
