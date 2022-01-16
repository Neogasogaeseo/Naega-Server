const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.post('/', checkUser, require('./teamPOST'));
router.post('/issue', checkUser, require('./teamIssuePOST'));

router.get('/', checkUser, require('./teamGET'));
router.get('/issue', checkUser, require('./teamIssueGET'));
router.get('/:teamId', checkUser, require('./teamDetailGET'));
router.get('/detail/issue', checkUser, require('./teamDetailIssueGET'));
router.get('/invite', checkUser, require('./teamInviteGET'));
router.post('/invite', checkUser, require('./teamInvitePOST'));
router.get('/issue/category', require('./teamIssueCategoryGET'));
router.get('/member/:teamId', checkUser, require('./teamMemberListGET'));
router.post('/feedback', checkUser, require('./teamFeedbackCreatePOST'));

module.exports = router;
