// assets.routes.js — routes /assets (montées sous /assets dans app.js).

const express = require('express');

const {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} = require('../controllers/assets.controller');

const router = express.Router();

router.get('/', getAssets); // GET    /assets
router.post('/', createAsset); // POST   /assets
router.put('/:id', updateAsset); // PUT    /assets/:id
router.delete('/:id', deleteAsset); // DELETE /assets/:id

module.exports = router;
