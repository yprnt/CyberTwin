const express = require('express');

const {
  getVulnerabilities,
  createVulnerability,
  deleteVulnerability,
} = require('../controllers/vulnerabilities.controller');

const router = express.Router();

router.get('/', getVulnerabilities);
router.post('/', createVulnerability);
router.delete('/:id', deleteVulnerability);

module.exports = router;
