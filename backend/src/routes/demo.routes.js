const express = require('express');

const { resetDemo, loadDemo } = require('../controllers/demo.controller');

const router = express.Router();

router.post('/load', loadDemo);
router.post('/reset', resetDemo);

module.exports = router;
