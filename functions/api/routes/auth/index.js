const express = require('express');
const router = express.Router();

<<<<<<< HEAD
router.use('/login', require('./authLoginPOST'));
router.use('/register', require('./authRegisterPOST'));
=======
router.post('/login', require('./authLoginPOST'));
router.post('/register', require('./authRegisterPOST'));
>>>>>>> a03c670f1b0dc5ec4dc35ef29023eec9a3a68e65

module.exports = router;
