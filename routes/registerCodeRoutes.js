const express = require('express');
const registerCode = require('../controllers/registerCodeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, registerCode);

module.exports = router;
