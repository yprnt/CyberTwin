// npm run db:check — vérifie connexion, schéma et encodage des accents.

require('dotenv').config();

const pool = require('./pool');

async function main() {
  const [tables] = await pool.query('SHOW TABLES');
  const names = tables.map((row) => Object.values(row)[0]);
  console.log('Tables présentes :', names.join(', ') || '(aucune)');

  const [company] = await pool.query('SELECT id, nom, servicesExposes FROM company WHERE id = 1');
  console.log('Ligne company    :', company[0] || '(absente !)');

  // l'ENUM criticite doit contenir « élevée » intact (test accents)
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
