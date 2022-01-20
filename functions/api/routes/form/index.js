const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/', checkUser, require('./formMyGET'));
router.get('/new', checkUser, require('./formMyNewGET'));
router.get('/template/popular', checkUser, require('./formTemplatePopularGET'));
router.get('/template/recent', checkUser, require('./formTemplateRecentGET'));
router.get('/answer', require('./formAnswerGET'));
router.post('/answer', require('./formAnswerCreatePOST'));
router.get('/banner', checkUser, require('./formBannerGET'));
router.post('/create', checkUser, require('./formCreatePOST'));
router.get('/create/:formId', checkUser, require('./formCreateGET'));
router.get('/detail/:formId', checkUser, require('./formDetailGET'));
router.get('/detail/:formId/answer', checkUser, require('./formDetailAnswerGET'));

module.exports = router;
