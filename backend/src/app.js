// app.js — configuration de l'application Express.
// Ne démarre PAS le serveur (c'est le rôle de server.js) : ici on assemble
// uniquement les middlewares et les routes, ce qui rend l'app testable.

const express = require('express');
const cors = require('cors');

const companyRoutes = require('./routes/company.routes');

const app = express();

// CORS activé : le front (http://localhost:5173) doit pouvoir appeler l'API (port 3000).
app.use(cors());

// Parse automatiquement les corps de requête JSON (Content-Type: application/json).
app.use(express.json());

// Route 0 — Health check. Permet de vérifier en 2 secondes que le serveur tourne.
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CyberTwin API' });
});

// Routes métier
app.use('/company', companyRoutes);

module.exports = app;
