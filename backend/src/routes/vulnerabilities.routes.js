const express = require('express');

const {
  getVulnerabilities,
  createVulnerability,
  deleteVulnerability,
} = require('../controllers/vulnerabilities.controller');

// mergeParams : accéder à :companyId du routeur parent (companies.routes).
const router = express.Router({ mergeParams: true });

router.get('/', getVulnerabilities);
router.post('/', createVulnerability);
router.delete('/:vulnId', deleteVulnerability);

module.exports = router;
