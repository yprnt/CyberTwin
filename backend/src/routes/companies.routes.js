const express = require('express');

const { list, getOne, create, update, remove } = require('../controllers/companies.controller');
const loadCompany = require('../middlewares/loadCompany');
const assetsRoutes = require('./assets.routes');
const vulnerabilitiesRoutes = require('./vulnerabilities.routes');
const riskRoutes = require('./risk.routes');

const router = express.Router();

// CRUD des entreprises de l'utilisateur courant.
router.get('/', list);
router.post('/', create);
router.get('/:companyId', getOne);
router.put('/:companyId', update);
router.delete('/:companyId', remove);

// Sous-ressources : loadCompany vérifie l'appartenance et pose req.companyId.
router.use('/:companyId/assets', loadCompany, assetsRoutes);
router.use('/:companyId/vulnerabilities', loadCompany, vulnerabilitiesRoutes);
router.use('/:companyId/risk', loadCompany, riskRoutes);

module.exports = router;
