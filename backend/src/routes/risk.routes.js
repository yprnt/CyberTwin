const express = require('express');

const { calculateRisk } = require('../controllers/risk.controller');

const router = express.Router();

router.post('/calculate', calculateRisk);

module.exports = router;
