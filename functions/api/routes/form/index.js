const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.get('/', checkUser, require('./formMyGET'));
router.get('/all', checkUser, require('./formMyAllGET'));
router.get('/template/popular', checkUser, require('./formTemplatePopularGET'));
router.get('/template/recent', checkUser, require('./formTemplateRecentGET'));
router.get('/template', checkUser, require('./formTemplateGET'));
router.get('/answer', require('./formAnswerGET'));
router.post('/answer', require('./formAnswerCreatePOST'));
router.delete('/answer/:answerId', checkUser, require('./formAnswerDELETE'));
router.get('/banner', checkUser, require('./formBannerGET'));
router.post('/create', checkUser, require('./formCreatePOST'));
router.get('/create/:formId', checkUser, require('./formCreateGET'));
router.get('/detail/:formId', checkUser, require('./formDetailGET'));
router.get('/detail/:formId/answer', checkUser, require('./formDetailAnswerGET'));
router.put('/detail/answer/:answerId/pin', checkUser, require('./formDetailAnswerPinPUT'));
router.get('/answer/pick/form', checkUser, require('./formAnswerPickFormListGET'));
router.get('/answer/pick', checkUser, require('./formAnswerPickGET'));

module.exports = router;
