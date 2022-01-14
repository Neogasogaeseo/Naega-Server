const express = require('express');
const router = express.Router();
const { checkUser } = require('../../../middlewares/auth');

router.post('/', require('./teamPOST'));


// router.get('/', checkUser, require('./teamGET'));
// router.get('/issue', checkUser, require('./teamIssueGET'));

module.exports = router;
