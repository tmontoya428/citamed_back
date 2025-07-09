const express = require('express');
const getWinners = require('../controllers/winnersController');

const router = express.Router();

router.get('/', getWinners);

module.exports = router;
