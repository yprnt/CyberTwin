// demo.routes.js — routes /demo (montées sous /demo dans app.js).

const express = require('express');

const { resetDemo, loadDemo } = require('../controllers/demo.controller');

const router = express.Router();

router.post('/load', loadDemo); // POST /demo/load
router.post('/reset', resetDemo); // POST /demo/reset

module.exports = router;
