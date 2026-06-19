// check.js — teste que le pool se connecte bien et que le schéma est en place.
//
//   npm run db:check
//
// Affiche les tables, la ligne company (singleton) et le bon encodage des accents.

require('dotenv').config();

const pool = require('./pool');

async function main() {
  // 1) Connexion + liste des tables
  const [tables] = await pool.query('SHOW TABLES');
  const names = tables.map((row) => Object.values(row)[0]);
  console.log('Tables présentes :', names.join(', ') || '(aucune)');

  // 2) La ligne singleton company doit exister (id = 1)
  const [company] = await pool.query('SELECT id, nom, servicesExposes FROM company WHERE id = 1');
  console.log('Ligne company    :', company[0] || '(absente !)');

  // 3) Vérif accents : l'ENUM criticite doit contenir « élevée » intact
  const [enumInfo] = await pool.query(
    "SELECT COLUMN_TYPE FROM information_schema.COLUMNS " +
    "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vulnerabilities' AND COLUMN_NAME = 'criticite'",
    [process.env.DB_NAME || 'cybertwin']
  );
  console.log('ENUM criticite   :', enumInfo[0] ? enumInfo[0].COLUMN_TYPE : '(introuvable)');

  const ok = names.includes('company') && names.includes('assets') && names.includes('vulnerabilities');
  console.log(ok ? '\n✅ Connexion OK et 3 tables présentes.' : '\n❌ Schéma incomplet.');

  await pool.end();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ Échec du test de connexion :', err.message);
  console.error('   Base initialisée ?  ->  npm run db:init   (et docker compose up -d)');
  process.exit(1);
});
