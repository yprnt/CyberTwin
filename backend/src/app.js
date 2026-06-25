// assemble middlewares + routes sans démarrer le serveur (app testable).

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const companiesRoutes = require('./routes/companies.routes');
const demoRoutes = require('./routes/demo.routes');

const requireAuth = require('./middlewares/requireAuth');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// le front (5173) doit pouvoir appeler l'API (3000)
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CyberTwin API' });
});

// Routes publiques : health check (ci-dessus) + authentification.
app.use('/auth', authRoutes);

// À partir d'ici, tout exige un jeton valide (requireAuth pose req.user).
app.use(requireAuth);

// Entreprises de l'utilisateur + sous-ressources imbriquées (actifs, vulns, risque).
app.use('/companies', companiesRoutes);
app.use('/demo', demoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;