const express = require('express');

const { loadDemo } = require('../controllers/demo.controller');

const router = express.Router();

router.post('/load', loadDemo);

module.exports = router;
