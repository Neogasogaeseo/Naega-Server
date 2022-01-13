const express = require('express');
const router = express.Router();

router.get('/', require('./teamGET'));
router.get('/issue', require('./teamIssueGET'));

module.exports = router;
