const express = require('express');
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

router.get('/', checkUser, require('./teamGET'));
router.get('/issue', checkUser, require('./teamIssueGET'));
router.get('/detail', checkUser, require('./teamDetailGET'));
router.get('/detail/issue', checkUser, require('./teamDetailIssueGET'));

module.exports = router;
