// risk.routes.js — routes /risk (montées sous /risk dans app.js).

const express = require('express');

const { calculateRisk } = require('../controllers/risk.controller');

const router = express.Router();

router.post('/calculate', calculateRisk); // POST /risk/calculate

module.exports = router;
