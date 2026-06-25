const express = require('express');

const {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} = require('../controllers/assets.controller');

// mergeParams : accéder à :companyId du routeur parent (companies.routes).
const router = express.Router({ mergeParams: true });

router.get('/', getAssets);
router.post('/', createAsset);
router.put('/:assetId', updateAsset);
router.delete('/:assetId', deleteAsset);

module.exports = router;
