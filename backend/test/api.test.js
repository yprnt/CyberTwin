// api.test.js — tests d'intégration de toute l'API (lancés par `npm test`).
//
// Prérequis : MySQL doit tourner et le schéma être chargé :
//     docker compose up -d   (à la racine)
//     npm run db:init        (dans backend/)
//
// Les tests démarrent l'app sur un port libre aléatoire (app.listen(0)),
// donc aucun conflit avec un serveur de dev déjà lancé.

require('dotenv').config();

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const pool = require('../src/db/pool');

let server;
let base;
let token;
let tokenAutre; // 2e compte, pour tester l'isolation entre utilisateurs
let companyId; // entreprise de travail créée dans before

// Identifiants du compte de test (username unique par run pour rester rejouable
// sans re-init de la base). Réutilisés par les tests d'authentification.
const username = `tester_${Date.now()}`;
const password = 'secret123';

// Helper d'appel. auth=true (défaut) joint le jeton ; le passer à false pour
// tester l'accès non authentifié.
async function api(method, path, body, { auth = true } = {}) {
  const opts = { method, headers: {} };
  if (auth && token) opts.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const COMPANY = {
  nom: 'Boréale Logistique',
  secteur: 'Transport et logistique',
  nbEmployes: 48,
  nbServeurs: 6,
  nbPostes: 35,
  servicesExposes: ['Site web', 'VPN'],
};

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
  // Les routes métier sont protégées : on s'authentifie, puis on crée une entreprise.
  const reg = await api('POST', '/auth/register', { username, password }, { auth: false });
  token = reg.data.token;
  const created = await api('POST', '/companies', COMPANY);
  companyId = created.data.id;
  // 2e compte pour les tests d'isolation.
  const reg2 = await api('POST', '/auth/register', { username: `autre_${Date.now()}`, password }, { auth: false });
  tokenAutre = reg2.data.token;
});

// Appel en tant que 2e compte (en-tête Authorization explicite).
function asAutre(method, path) {
  return fetch(base + path, { method, headers: { Authorization: `Bearer ${tokenAutre}` } });
}

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

// ------------------------------------------------------------------ Health
test('GET / renvoie le health check', async () => {
  const { status, data } = await api('GET', '/');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

// ------------------------------------------------------------------ Auth
test('register du compte de test a renvoyé un jeton', () => {
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 0);
});

test('POST /auth/register username déjà pris -> 409', async () => {
  const { status } = await api('POST', '/auth/register', { username, password }, { auth: false });
  assert.equal(status, 409);
});

test('POST /auth/register mot de passe trop court -> 400', async () => {
  const { status } = await api(
    'POST',
    '/auth/register',
    { username: `court_${Date.now()}`, password: '123' },
    { auth: false }
  );
  assert.equal(status, 400);
});

test('POST /auth/login mauvais mot de passe -> 401', async () => {
  const { status } = await api('POST', '/auth/login', { username, password: 'faux' }, { auth: false });
  assert.equal(status, 401);
});

test('POST /auth/login valide -> 200 + jeton', async () => {
  const { status, data } = await api('POST', '/auth/login', { username, password }, { auth: false });
  assert.equal(status, 200);
  assert.equal(typeof data.token, 'string');
  assert.equal(data.user.username, username);
});

test('GET /auth/me avec jeton -> 200', async () => {
  const { status, data } = await api('GET', '/auth/me');
  assert.equal(status, 200);
  assert.equal(data.user.username, username);
});

test('GET /companies sans jeton -> 401', async () => {
  const { status } = await api('GET', '/companies', undefined, { auth: false });
  assert.equal(status, 401);
});

test('GET /companies avec jeton invalide -> 401', async () => {
  const res = await fetch(base + '/companies', { headers: { Authorization: 'Bearer pas-un-vrai-jwt' } });
  assert.equal(res.status, 401);
});

// ------------------------------------------------------------------ Companies
test('GET /companies liste contient l’entreprise créée', async () => {
  const { status, data } = await api('GET', '/companies');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
  assert.ok(data.some((c) => c.id === companyId));
});

test('POST /companies sans nom -> 400', async () => {
  const { status } = await api('POST', '/companies', { secteur: 'Transport' });
  assert.equal(status, 400);
});

test('POST /companies sans service exposé -> 400', async () => {
  const { status } = await api('POST', '/companies', {
    nom: 'X',
    secteur: 'Transport',
    nbEmployes: 1,
    nbServeurs: 1,
    nbPostes: 1,
    servicesExposes: [],
  });
  assert.equal(status, 400);
});

test('POST /companies accepte des effectifs à 0', async () => {
  const { status, data } = await api('POST', '/companies', {
    nom: 'PME Cloud',
    secteur: 'Services',
    nbEmployes: 0,
    nbServeurs: 0,
    nbPostes: 0,
    servicesExposes: ['Site web'],
  });
  assert.equal(status, 201);
  assert.equal(data.nbServeurs, 0);
  assert.ok(Number.isInteger(data.id));
});

test('GET /companies/:id renvoie l’entreprise', async () => {
  const { status, data } = await api('GET', `/companies/${companyId}`);
  assert.equal(status, 200);
  assert.equal(data.nom, COMPANY.nom);
  assert.deepEqual(data.servicesExposes, COMPANY.servicesExposes);
});

test('PUT /companies/:id met à jour -> 200', async () => {
  const { status, data } = await api('PUT', `/companies/${companyId}`, {
    ...COMPANY,
    secteur: 'Logistique (mis à jour)',
  });
  assert.equal(status, 200);
  assert.equal(data.secteur, 'Logistique (mis à jour)');
});

test('PUT /companies/:id sans secteur -> 400', async () => {
  const { status } = await api('PUT', `/companies/${companyId}`, { nom: 'X' });
  assert.equal(status, 400);
});

test('isolation : l’entreprise d’un autre compte renvoie 404', async () => {
  assert.equal((await asAutre('GET', `/companies/${companyId}`)).status, 404);
  assert.equal((await asAutre('DELETE', `/companies/${companyId}`)).status, 404);
});

test('isolation : sous-ressources d’un autre compte renvoient 404', async () => {
  assert.equal((await asAutre('GET', `/companies/${companyId}/assets`)).status, 404);
  assert.equal((await asAutre('GET', `/companies/${companyId}/vulnerabilities`)).status, 404);
  assert.equal((await asAutre('POST', `/companies/${companyId}/risk/calculate`)).status, 404);
});

// ------------------------------------------------------------------ Assets
let assetId;

test('GET assets d’une entreprise vide -> []', async () => {
  const { status, data } = await api('GET', `/companies/${companyId}/assets`);
  assert.equal(status, 200);
  assert.deepEqual(data, []);
});

test('POST asset valide -> 201 avec id', async () => {
  const { status, data } = await api('POST', `/companies/${companyId}/assets`, {
    nom: 'Serveur vitrine',
    type: 'Serveur Web',
    expose: true,
  });
  assert.equal(status, 201);
  assert.ok(Number.isInteger(data.id));
  assert.equal(data.expose, true);
  assetId = data.id;
});

test('POST asset type invalide -> 400', async () => {
  const { status } = await api('POST', `/companies/${companyId}/assets`, { nom: 'X', type: 'Imprimante' });
  assert.equal(status, 400);
});

test('PUT asset valide -> 200', async () => {
  const { status, data } = await api('PUT', `/companies/${companyId}/assets/${assetId}`, {
    nom: 'Renommé',
    expose: false,
  });
  assert.equal(status, 200);
  assert.equal(data.nom, 'Renommé');
  assert.equal(data.expose, false);
});

test('PUT asset inexistant -> 404', async () => {
  const { status } = await api('PUT', `/companies/${companyId}/assets/999999`, { nom: 'X' });
  assert.equal(status, 404);
});

// ------------------------------------------------------ Vulnerabilities
let vulnId;

test('POST vuln valide -> 201', async () => {
  const { status, data } = await api('POST', `/companies/${companyId}/vulnerabilities`, {
    assetId,
    nom: 'Logiciel obsolète',
    criticite: 'élevée',
  });
  assert.equal(status, 201);
  assert.equal(data.criticite, 'élevée');
  vulnId = data.id;
});

test('POST vuln criticité invalide -> 400', async () => {
  const { status } = await api('POST', `/companies/${companyId}/vulnerabilities`, {
    assetId,
    nom: 'X',
    criticite: 'haute',
  });
  assert.equal(status, 400);
});

test('POST vuln assetId hors entreprise -> 404', async () => {
  const { status } = await api('POST', `/companies/${companyId}/vulnerabilities`, {
    assetId: 999999,
    nom: 'X',
    criticite: 'faible',
  });
  assert.equal(status, 404);
});

test('GET vulnerabilities contient la vuln créée', async () => {
  const { status, data } = await api('GET', `/companies/${companyId}/vulnerabilities`);
  assert.equal(status, 200);
  assert.ok(data.some((v) => v.id === vulnId));
});

test('DELETE asset supprime ses vulns en cascade (R3)', async () => {
  const del = await api('DELETE', `/companies/${companyId}/assets/${assetId}`);
  assert.equal(del.status, 200);
  const { data } = await api('GET', `/companies/${companyId}/vulnerabilities`);
  assert.ok(!data.some((v) => v.assetId === assetId));
});

test('DELETE vuln inexistante -> 404', async () => {
  const { status } = await api('DELETE', `/companies/${companyId}/vulnerabilities/999999`);
  assert.equal(status, 404);
});

// ------------------------------------------------------------------ Risk
test('POST risk/calculate renvoie le format figé', async () => {
  const { status, data } = await api('POST', `/companies/${companyId}/risk/calculate`);
  assert.equal(status, 200);
  assert.equal(typeof data.score, 'number');
  assert.ok(data.score >= 0 && data.score <= 100);
  assert.ok(['faible', 'moyen', 'élevé'].includes(data.niveau));
  assert.ok(Array.isArray(data.recommandations) && data.recommandations.length >= 1);
});

test('POST risk/snapshot archive le risque courant -> 201', async () => {
  const calc = await api('POST', `/companies/${companyId}/risk/calculate`);
  const { status, data } = await api('POST', `/companies/${companyId}/risk/snapshot`);
  assert.equal(status, 201);
  // Le snapshot reflète bien le calcul du moment.
  assert.equal(data.score, calc.data.score);
  assert.equal(data.niveau, calc.data.niveau);
  assert.equal(data.nbActifs, calc.data.nbActifs);
  assert.ok(data.createdAt);
});

test('GET risk/history contient le snapshot', async () => {
  const { status, data } = await api('GET', `/companies/${companyId}/risk/history`);
  assert.equal(status, 200);
  assert.ok(Array.isArray(data) && data.length >= 1);
});

test('DELETE risk/history vide l’historique -> 200', async () => {
  const del = await api('DELETE', `/companies/${companyId}/risk/history`);
  assert.equal(del.status, 200);
  const { data } = await api('GET', `/companies/${companyId}/risk/history`);
  assert.deepEqual(data, []);
});

// ------------------------------------------------------------------ Démo
test('POST /demo/load crée une entreprise 6 actifs / 5 vulns', async () => {
  const { status, data } = await api('POST', '/demo/load');
  assert.equal(status, 201);
  assert.ok(Number.isInteger(data.id));
  assert.equal(data.nbActifs, 6);
  assert.equal(data.nbVulnerabilites, 5);

  // L'entreprise de démo a bien ses actifs et un score calculable.
  const risk = await api('POST', `/companies/${data.id}/risk/calculate`);
  assert.equal(risk.status, 200);
  assert.equal(risk.data.nbActifs, 6);
});

// ------------------------------------------------------------------ Suppression en cascade
test('DELETE /companies/:id supprime l’entreprise et ses données', async () => {
  const created = await api('POST', '/companies', { ...COMPANY, nom: 'À supprimer' });
  const cid = created.data.id;
  await api('POST', `/companies/${cid}/assets`, { nom: 'A', type: 'Routeur' });

  const del = await api('DELETE', `/companies/${cid}`);
  assert.equal(del.status, 200);

  // L'entreprise n'existe plus : ses sous-ressources renvoient 404 (cascade SQL).
  const after = await api('GET', `/companies/${cid}/assets`);
  assert.equal(after.status, 404);
});

// ------------------------------------------------------------------ Erreurs uniformes
test('Route inconnue -> 404 JSON', async () => {
  const { status, data } = await api('GET', '/nope');
  assert.equal(status, 404);
  assert.ok(data.message);
});

test('JSON malformé -> 400 JSON', async () => {
  const { status, data } = await api('POST', '/companies', '{"nom": bad');
  assert.equal(status, 400);
  assert.ok(data.message);
});
