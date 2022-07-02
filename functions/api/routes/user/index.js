const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();
const uploadImage = require('../../../middlewares/uploadImage');

router.post('/keyword', require('./keywordCreatePOST'));
router.delete('/keyword', require('./keywordDELETE'));
router.delete('/myKeyword', checkUser, require('./myKeywordDELETE'));
router.get('/keywordDataSettingForUpdateMZRZ', require('./keywordDataSetting'));

router.put('/edit', checkUser, uploadImage('user'), require('./userProfileEditPUT'));

router.get('/search', checkUser, require('./userSearchGET'));
router.get('/keyword', require('./keywordListGET'));
router.get('/myKeyword', checkUser, require('./myKeywordListGET'));

router.get('/notice/bar', checkUser, require('./userNoticeBarGET'));
router.get('/notice', checkUser, require('./userNoticeListGET'));
router.get('/', checkUser, require('./userInformationByTokenGET'));
router.get('/:profileId', require('./userInformationByProfileIdGET'));
router.get('/:profileId/answer', require('./userPinnedAnswerGET'));
router.get('/:profileId/team', require('./userPinnedTeamGET'));
router.get('/edit/profileId/:profileId', checkUser, require('./userIdDuplicateCheckGET'));

router.delete('/', checkUser, require('./userDELETE'));

module.exports = router;
