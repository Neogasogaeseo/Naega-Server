const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.post('/', checkUser, require('./teamPOST'));

router.get('/', checkUser, require('./teamGET'));
router.get('/issue', checkUser, require('./teamIssueGET'));
router.get('/detail', checkUser, require('./teamDetailGET'));
router.get('/detail/issue', checkUser, require('./teamDetailIssueGET'));
router.get('/invite', checkUser, require('./teamInviteGET'));
router.post('/invite', checkUser, require('./teamInvitePOST'));

module.exports = router;
