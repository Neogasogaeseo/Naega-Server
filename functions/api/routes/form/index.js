const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/', checkUser, require('./formMyGET'));
router.get('/new', checkUser, require('./formMyNewGET'));
router.get('/most', checkUser, require('./formMyMostGET'));
router.get('/template/popular', checkUser, require('./formTemplatePopularGET'));
router.get('/template/recent', checkUser, require('./formTemplateRecentGET'));
router.get('/answer', require('./formAnswerGET'));
router.post('/answer', require('./formAnswerCreatePOST'));
router.delete('/answer/:answerId', checkUser, require('./formAnswerDELETE'));
router.get('/banner', checkUser, require('./formBannerGET'));
router.post('/create', checkUser, require('./formCreatePOST'));
router.get('/create/:formId', checkUser, require('./formCreateGET'));
router.get('/detail/:formId', checkUser, require('./formDetailGET'));
router.get('/detail/:formId/answer', checkUser, require('./formDetailAnswerGET'));
router.put('/detail/answer/:answerId/pin', checkUser, require('./formDetailAnswerPinPUT'));

module.exports = router;
