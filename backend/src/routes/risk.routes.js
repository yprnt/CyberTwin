const express = require('express');

const {
  calculateRisk,
  saveSnapshot,
  getHistory,
  clearHistory,
} = require('../controllers/risk.controller');

// mergeParams : accéder à :companyId du routeur parent (companies.routes).
const router = express.Router({ mergeParams: true });

router.post('/calculate', calculateRisk);
router.post('/snapshot', saveSnapshot);
router.get('/history', getHistory);
router.delete('/history', clearHistory);

module.exports = router;
