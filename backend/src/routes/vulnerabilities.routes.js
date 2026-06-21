// vulnerabilities.routes.js — routes /vulnerabilities (montées dans app.js).

const express = require('express');

const {
  getVulnerabilities,
  createVulnerability,
  deleteVulnerability,
} = require('../controllers/vulnerabilities.controller');

const router = express.Router();

router.get('/', getVulnerabilities); // GET    /vulnerabilities
router.post('/', createVulnerability); // POST   /vulnerabilities
router.delete('/:id', deleteVulnerability); // DELETE /vulnerabilities/:id

module.exports = router;
