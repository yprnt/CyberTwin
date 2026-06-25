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

// Petit helper pour appeler l'API et récupérer { status, data }.
async function api(method, path, body) {
  const opts = { method, headers: {} };
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

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
  // On part d'une base propre.
  await api('POST', '/demo/reset');
});

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

// ------------------------------------------------------------------ Company
test('GET /company renvoie une entreprise vide après reset', async () => {
  const { status, data } = await api('GET', '/company');
  assert.equal(status, 200);
  assert.equal(data.nom, '');
  assert.ok(Array.isArray(data.servicesExposes));
});

test('PUT /company sans nom -> 400', async () => {
  const { status, data } = await api('PUT', '/company', { secteur: 'Transport' });
  assert.equal(status, 400);
  assert.ok(data.message);
});

test('PUT /company valide -> 200 et persiste', async () => {
  const payload = {
    nom: 'Boréale Logistique',
    secteur: 'Transport et logistique',
    nbEmployes: 48,
    nbServeurs: 6,
    nbPostes: 35,
    servicesExposes: ['Site web', 'VPN'],
  };
  const { status, data } = await api('PUT', '/company', payload);
  assert.equal(status, 200);
  assert.equal(data.nom, 'Boréale Logistique');
  assert.deepEqual(data.servicesExposes, ['Site web', 'VPN']);
});

test('PUT /company sans les effectifs -> 400', async () => {
  const { status } = await api('PUT', '/company', {
    nom: 'X',
    secteur: 'Transport',
    servicesExposes: ['Site web'],
  });
  assert.equal(status, 400);
});

test('PUT /company sans service exposé -> 400', async () => {
  const { status } = await api('PUT', '/company', {
    nom: 'X',
    secteur: 'Transport',
    nbEmployes: 10,
    nbServeurs: 2,
    nbPostes: 8,
    servicesExposes: [],
  });
  assert.equal(status, 400);
});

test('PUT /company accepte des effectifs à 0', async () => {
  const { status, data } = await api('PUT', '/company', {
    nom: 'PME Cloud',
    secteur: 'Services',
    nbEmployes: 0,
    nbServeurs: 0,
    nbPostes: 0,
    servicesExposes: ['Site web'],
  });
  assert.equal(status, 200);
  assert.equal(data.nbServeurs, 0);
});

// ------------------------------------------------------------------ Assets
let assetId;

test('GET /assets vide -> []', async () => {
  const { status, data } = await api('GET', '/assets');
  assert.equal(status, 200);
  assert.deepEqual(data, []);
});

test('POST /assets valide -> 201 avec id', async () => {
  const { status, data } = await api('POST', '/assets', {
    nom: 'Serveur vitrine',
    type: 'Serveur Web',
    expose: true,
  });
  assert.equal(status, 201);
  assert.ok(Number.isInteger(data.id));
  assert.equal(data.expose, true);
  assetId = data.id;
});

test('POST /assets type invalide -> 400', async () => {
  const { status } = await api('POST', '/assets', { nom: 'X', type: 'Imprimante' });
  assert.equal(status, 400);
});

test('POST /assets sans nom/type -> 400', async () => {
  const { status } = await api('POST', '/assets', { expose: true });
  assert.equal(status, 400);
});

test('PUT /assets/:id valide -> 200', async () => {
  const { status, data } = await api('PUT', `/assets/${assetId}`, { nom: 'Renommé', expose: false });
  assert.equal(status, 200);
  assert.equal(data.nom, 'Renommé');
  assert.equal(data.expose, false);
});

test('PUT /assets/:id inexistant -> 404', async () => {
  const { status } = await api('PUT', '/assets/999999', { nom: 'X' });
  assert.equal(status, 404);
});

test('DELETE /assets/:id inexistant -> 404', async () => {
  const { status } = await api('DELETE', '/assets/999999');
  assert.equal(status, 404);
});

// ------------------------------------------------------ Vulnerabilities
let vulnId;

test('POST /vulnerabilities valide -> 201', async () => {
  const { status, data } = await api('POST', '/vulnerabilities', {
    assetId,
    nom: 'Logiciel obsolète',
    criticite: 'élevée',
  });
  assert.equal(status, 201);
  assert.equal(data.criticite, 'élevée');
  vulnId = data.id;
});

test('POST /vulnerabilities criticité invalide -> 400', async () => {
  const { status } = await api('POST', '/vulnerabilities', {
    assetId,
    nom: 'X',
    criticite: 'haute',
  });
  assert.equal(status, 400);
});

test('POST /vulnerabilities assetId inexistant -> 404', async () => {
  const { status } = await api('POST', '/vulnerabilities', {
    assetId: 999999,
    nom: 'X',
    criticite: 'faible',
  });
  assert.equal(status, 404);
});

test('GET /vulnerabilities contient la vuln créée', async () => {
  const { status, data } = await api('GET', '/vulnerabilities');
  assert.equal(status, 200);
  assert.ok(data.some((v) => v.id === vulnId));
});

test('DELETE /assets/:id supprime ses vulns en cascade (R3)', async () => {
  const del = await api('DELETE', `/assets/${assetId}`);
  assert.equal(del.status, 200);
  const { data } = await api('GET', '/vulnerabilities');
  assert.ok(!data.some((v) => v.assetId === assetId));
});

test('DELETE /vulnerabilities/:id inexistant -> 404', async () => {
  const { status } = await api('DELETE', '/vulnerabilities/999999');
  assert.equal(status, 404);
});

// ------------------------------------------------------------------ Demo + Risk
test('POST /demo/load charge 6 actifs et 5 vulns', async () => {
  const { status, data } = await api('POST', '/demo/load');
  assert.equal(status, 200);
  assert.equal(data.nbActifs, 6);
  assert.equal(data.nbVulnerabilites, 5);
});

test('POST /risk/calculate renvoie le format figé', async () => {
  const { status, data } = await api('POST', '/risk/calculate');
  assert.equal(status, 200);
  assert.equal(typeof data.score, 'number');
  assert.ok(data.score >= 0 && data.score <= 100);
  assert.ok(['faible', 'moyen', 'élevé'].includes(data.niveau));
  assert.equal(data.nbActifs, 6);
  assert.equal(data.nbVulnerabilites, 5);
  assert.ok(Array.isArray(data.recommandations) && data.recommandations.length >= 1);
});

test('POST /demo/reset vide tout', async () => {
  const { status } = await api('POST', '/demo/reset');
  assert.equal(status, 200);
  const assets = await api('GET', '/assets');
  assert.deepEqual(assets.data, []);
});

// ------------------------------------------------------------------ Erreurs uniformes
test('Route inconnue -> 404 JSON', async () => {
  const { status, data } = await api('GET', '/nope');
  assert.equal(status, 404);
  assert.ok(data.message);
});

test('JSON malformé -> 400 JSON', async () => {
  const { status, data } = await api('PUT', '/company', '{"nom": bad');
  assert.equal(status, 400);
  assert.ok(data.message);
});
