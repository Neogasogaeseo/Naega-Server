const express = require('express');
<<<<<<< HEAD
const router = express.Router();

router.post('/', require('./teamPOST'));
=======
const { checkUser } = require('../../../middlewares/auth');
const router = express.Router();

// router.get('/', checkUser, require('./teamGET'));
// router.get('/issue', checkUser, require('./teamIssueGET'));
>>>>>>> a03c670f1b0dc5ec4dc35ef29023eec9a3a68e65

module.exports = router;
