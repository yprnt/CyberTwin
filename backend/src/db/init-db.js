// npm run db:init — (ré)initialise la base à partir de schema.sql.
// Connexion ROOT sans base sélectionnée : c'est schema.sql qui fait DROP/CREATE/USE.

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function main() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ROOT_USER || 'root',
    password: process.env.DB_ROOT_PASSWORD || 'root',
    multipleStatements: true, // indispensable : schema.sql enchaîne plusieurs requêtes
    charset: 'utf8mb4',
  });

  try {
    await connection.query(sql);
    console.log('✅ Base « cybertwin » (ré)initialisée depuis schema.sql.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('❌ Échec de l\'initialisation de la base :', err.message);
  console.error('   Le conteneur MySQL tourne-t-il ?  ->  docker compose up -d');
  process.exit(1);
});
