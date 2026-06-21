// server.js — point d'entrée : charge la config (.env) puis démarre le serveur HTTP.

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`CyberTwin API en écoute sur http://localhost:${PORT}`);
});
