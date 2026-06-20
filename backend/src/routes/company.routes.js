// company.routes.js — routes /company (montées sous /company dans app.js).

const express = require('express');

const { getCompany, updateCompany } = require('../controllers/company.controller');

const router = express.Router();

router.get('/', getCompany); // GET  /company
router.put('/', updateCompany); // PUT /company

module.exports = router;
