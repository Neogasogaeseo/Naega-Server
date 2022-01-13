const express = require('express');
const router = express.Router();

router.post('/', require('./teamPOST'));

module.exports = router;
