// pool MySQL partagé par toute l'API (.env chargé par server.js avant ce require).

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
  charset: 'utf8mb4', // un charset, pas une collation — pour les accents (« élevée »…)
});

module.exports = pool;
