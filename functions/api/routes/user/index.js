const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.post('/keyword',checkUser, require('./keywordCreatePOST'));
router.get('/search', require('./userSearchGET'));
router.get('/keyword', checkUser, require('./keywordListGET'));
router.get('/', checkUser, require('./userInformationByTokenGET'));
/**오늘의 한마디..
 * router.get('/:profileId', require('./userInformationByProfileIdGET'));
 * router.get('/:profileId/answer', require());
 * router.get('/:profileId/team', require());
*/

module.exports = router;
