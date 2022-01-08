const express = require('express');
const router = express.Router();

router.get('/test', require('./testGET'));

module.exports = router;
