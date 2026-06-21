// assemble middlewares + routes sans démarrer le serveur (app testable).

const express = require('express');
const cors = require('cors');

const companyRoutes = require('./routes/company.routes');
const assetsRoutes = require('./routes/assets.routes');
const vulnerabilitiesRoutes = require('./routes/vulnerabilities.routes');
const riskRoutes = require('./routes/risk.routes');
const demoRoutes = require('./routes/demo.routes');

const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// le front (5173) doit pouvoir appeler l'API (3000)
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CyberTwin API' });
});

app.use('/company', companyRoutes);
app.use('/assets', assetsRoutes);
app.use('/vulnerabilities', vulnerabilitiesRoutes);
app.use('/risk', riskRoutes);
app.use('/demo', demoRoutes);

// après toutes les routes
app.use(notFound);
// monté en dernier
app.use(errorHandler);

module.exports = app;
