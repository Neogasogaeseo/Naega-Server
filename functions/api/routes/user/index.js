const express = require('express');
const router = express.Router();

router.post('/keyword', require('./keywordCreatePOST'));

module.exports = router;
