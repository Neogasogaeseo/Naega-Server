const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');
const uploadImage = require('../../../middlewares/uploadImage');

router.post('/', checkUser, uploadImage('team'), require('./teamPOST'));
router.post('/issue', checkUser, uploadImage('issue'), require('./teamIssuePOST'));

router.get('/edit/:teamId', checkUser, require('./teamEditGET'));
router.put('/edit', checkUser, uploadImage('team'), require('./teamEditPUT'));
router.get('/edit/member/:teamId', checkUser, require('./teamMemberEditGET'));
router.post('/edit/member', checkUser, require('./teamMemberEditPOST'));

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
router.put('/feedback/:feedbackId', checkUser, require('./teamFeedbackPUT'));
router.delete('/feedback/:feedbackId', checkUser, require('./teamFeedbackDELETE'));

router.get('/issue/:issueId', checkUser, require('./teamIssueDetailGET'));
router.get('/issue/:issueId/feedback', checkUser, require('./teamIssueDetailFeedbackGET'));
router.put('/feedback/:feedbackId/pin', checkUser, require('./teamIssueDetailFeedbackPinPUT'));

router.put('/host', checkUser, require('./teamHostPUT'));
router.delete('/member', checkUser, require('./teamMemberDELETE'));
router.delete('/', checkUser, require('./teamDELETE'));

module.exports = router;
