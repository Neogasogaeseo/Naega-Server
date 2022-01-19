const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/template/popular', checkUser, require('./formTemplatePopularGET'));
router.get('/template/recent', checkUser, require('./formTemplateRecentGET'));
router.get('/answer', require('./formAnswerGET'));
router.post('/answer', require('./formAnswerCreatePOST'));
router.get('/banner', checkUser, require('./formBannerGET'));
router.post('/create', checkUser, require('./formCreatePOST'));

module.exports = router;
