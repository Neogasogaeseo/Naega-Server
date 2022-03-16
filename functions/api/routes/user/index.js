const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/keyword', require('./keywordCreatePOST'));

router.put('/edit', checkUser, require('./userProfileEditPUT'));

router.get('/search', checkUser, require('./userSearchGET'));
router.get('/keyword', require('./keywordListGET'));
router.get('/', checkUser, require('./userInformationByTokenGET'));
router.get('/:profileId', require('./userInformationByProfileIdGET'));
router.get('/:profileId/answer', require('./userPinnedAnswerGET'));
router.get('/:profileId/team', require('./userPinnedTeamGET'));
router.get('/edit/:profileId', checkUser, require('./userIdCheckGET'));


module.exports = router;
