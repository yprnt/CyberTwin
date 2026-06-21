const express = require('express');

const { getCompany, updateCompany } = require('../controllers/company.controller');

const router = express.Router();

router.get('/', getCompany);
router.put('/', updateCompany);

module.exports = router;
