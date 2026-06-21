// pool.js — pool de connexions MySQL partagé par toute l'API.
// On utilise l'API "promise" de mysql2 pour pouvoir faire des `await pool.query(...)`.
// Les identifiants viennent du .env (chargé par server.js avant le require de ce module).

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'cybertwin',
  password: process.env.DB_PASSWORD || 'cybertwin',
  database: process.env.DB_NAME || 'cybertwin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci', // accents : « élevée », « Base de données »…
});

module.exports = pool;
