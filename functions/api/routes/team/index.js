const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.post('/', checkUser, require('./teamPOST'));
router.post('/issue', checkUser, require('./teamIssuePOST'));

router.put('/edit', checkUser, require('./teamPUT'));

router.get('/', checkUser, require('./teamGET'));
router.get('/issue', checkUser, require('./teamIssueGET'));
router.get('/detail/:teamId', checkUser, require('./teamDetailGET'));
router.get('/detail/:teamId/issue', checkUser, require('./teamDetailIssueGET'));
router.get('/detail/:teamId/issue/my', checkUser, require('./teamDetailMyIssueGET'));
router.get('/invite', checkUser, require('./teamInviteGET'));
router.put('/invite/accept', checkUser, require('./teamInviteAcceptPUT'));
router.put('/invite/reject', checkUser, require('./teamInviteRejectPUT'));
router.get('/issue/category', require('./teamIssueCategoryGET'));
router.get('/member/:teamId', checkUser, require('./teamMemberListGET'));
router.post('/feedback', checkUser, require('./teamFeedbackCreatePOST'));

router.get('/issue/:issueId', checkUser, require('./teamIssueDetailGET'));
router.get('/issue/:issueId/feedback', checkUser, require('./teamIssueDetailFeedbackGET'));
router.put('/feedback/:feedbackId/pin', checkUser, require('./teamIssueDetailFeedbackPinPUT'));

module.exports = router;
