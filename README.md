# CyberTwin — Simulateur de risque cyber pour PME

Application web Fullstack qui modélise une entreprise fictive, gère ses **actifs**
informatiques et leurs **vulnérabilités**, et évalue automatiquement son **niveau de risque
cyber** (faible / moyen / élevé) avec des recommandations de sécurité.

Projet de binôme **Mehmet YUKSEL** / **Yanis PARENT** — **Backend** : Node.js / Express / MySQL · **Frontend** : Vue.js / Pinia.

---

## Architecture

Monorepo :

```
CyberTwin/
├── backend/        API REST Node.js + Express (MySQL via Docker)
├── frontend/       Application Vue.js (Vue Router + Pinia)  ← partie binôme
└── docker-compose.yml   Base de données MySQL 8
```

| Côté | Stack |
|------|-------|
| Backend | Node.js, Express, MySQL 8 (mysql2), dotenv, cors |
| Frontend | Vue.js, Vue Router, Pinia, Fetch API |
| Base | URL `http://localhost:3000` (back) · `http://localhost:5173` (front) |

---

## Prérequis

- [Docker](https://www.docker.com/) (Docker Desktop lancé)
- [Node.js](https://nodejs.org/) 18+

---

## Installation & exécution (backend)

```bash
# 1) Démarrer la base MySQL (à la racine du projet)
docker compose up -d

# 2) Installer et configurer le backend
cd backend
cp .env.example .env          # config locale (non versionnée)
npm install

# 3) Créer le schéma de la base
npm run db:init               # crée les 3 tables (destructif : repart de zéro)
npm run db:check              # vérifie la connexion

# 4) Lancer le serveur
npm run dev                   # http://localhost:3000  (ou: npm start)
```

Scripts utiles :

| Script | Rôle |
|--------|------|
| `npm run dev` | Serveur avec rechargement auto (nodemon) |
| `npm start` | Serveur simple |
| `npm run db:init` | (Re)crée la base et les tables depuis `src/db/schema.sql` |
| `npm run db:check` | Teste la connexion et l'état du schéma |
| `npm test` | Lance les tests d'intégration de l'API |

### Variables d'environnement (`backend/.env`)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PORT` | 3000 | Port du serveur API |
| `DB_HOST` / `DB_PORT` | localhost / 3306 | Connexion MySQL |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | cybertwin | Identifiants applicatifs |
| `DB_ROOT_USER` / `DB_ROOT_PASSWORD` | root | Utilisés **uniquement** par `db:init` |

---

## Base de données

3 tables (encodage **utf8mb4** obligatoire pour les accents) :

- **`company`** — entreprise unique (singleton, `id = 1`).
- **`assets`** — actifs ; `type` est un ENUM des 6 valeurs autorisées ; `expose` booléen.
- **`vulnerabilities`** — vulnérabilités ; `criticite` ENUM `faible/moyenne/élevée` ;
  clé étrangère vers `assets` avec **`ON DELETE CASCADE`** (supprimer un actif supprime ses vulns).

Les données sont persistées en base (volume Docker). `npm run db:init` repart de zéro.

---

## Documentation de l'API REST

URL de base : `http://localhost:3000` · Échanges **JSON** · **CORS** activé.

**Codes HTTP** : `200` OK · `201` Créé · `400` requête invalide · `404` introuvable.
**Format d'erreur** (toujours identique) : `{ "message": "..." }`.

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/` | Health check |
| GET | `/company` | Lire la fiche entreprise |
| PUT | `/company` | Créer / modifier l'entreprise |
| GET | `/assets` | Lister les actifs |
| POST | `/assets` | Ajouter un actif |
| PUT | `/assets/:id` | Modifier un actif |
| DELETE | `/assets/:id` | Supprimer un actif (+ ses vulnérabilités) |
| GET | `/vulnerabilities` | Lister les vulnérabilités |
| POST | `/vulnerabilities` | Ajouter une vulnérabilité à un actif |
| DELETE | `/vulnerabilities/:id` | Supprimer une vulnérabilité |
| POST | `/risk/calculate` | Calculer le score et le niveau de risque |
| POST | `/demo/load` | Charger la démonstration « Boréale » |
| POST | `/demo/reset` | Vider toutes les données |

### Détail des routes

#### `GET /` — health check
→ `200` `{ "status": "ok", "service": "CyberTwin API" }`

#### `GET /company`
→ `200` l'entreprise (champs vides si pas encore créée) :
```json
{ "nom": "", "secteur": "", "nbEmployes": 0, "nbServeurs": 0, "nbPostes": 0, "servicesExposes": [] }
```

#### `PUT /company`
Reçoit un objet entreprise. Tous les champs sont obligatoires : `nom`, `secteur`,
les effectifs (`nbEmployes`, `nbServeurs`, `nbPostes` — entiers positifs ou nuls, `0` accepté)
et au moins un service dans `servicesExposes`.
→ `200` entreprise à jour · `400` si un champ requis manque.
```json
{ "nom": "Boréale Logistique", "secteur": "Transport et logistique",
  "nbEmployes": 48, "nbServeurs": 6, "nbPostes": 35,
  "servicesExposes": ["Site web", "VPN"] }
```

#### `GET /assets`
→ `200` tableau d'actifs (`[]` si aucun).
```json
[ { "id": 1, "nom": "Serveur du site vitrine", "type": "Serveur Web", "expose": true } ]
```

#### `POST /assets`
Reçoit `{ nom, type, expose? }` (sans `id`). `type` ∈ des 6 valeurs autorisées.
→ `201` actif créé avec son `id` · `400` si nom/type manquant ou type non autorisé.

Types autorisés : `Serveur Web`, `Base de données`, `Poste utilisateur`, `Routeur`,
`Pare-feu`, `Application métier`.

#### `PUT /assets/:id`
Reçoit les champs à modifier. → `200` actif modifié · `404` id inconnu · `400` type invalide.

#### `DELETE /assets/:id`
→ `200` `{ "message": "Actif supprimé." }` (+ suppression en cascade des vulns) · `404` id inconnu.

#### `GET /vulnerabilities`
→ `200` tableau (`[]` si aucune).
```json
[ { "id": 1, "assetId": 1, "nom": "Logiciel obsolète", "criticite": "élevée" } ]
```

#### `POST /vulnerabilities`
Reçoit `{ assetId, nom, criticite }`. `criticite` ∈ `faible|moyenne|élevée`.
→ `201` vuln créée · `400` champ manquant/criticité invalide · `404` actif inexistant.

#### `DELETE /vulnerabilities/:id`
→ `200` `{ "message": "Vulnérabilité supprimée." }` · `404` id inconnu.

#### `POST /risk/calculate`
**Body vide.** Calcule à partir de l'état courant.
→ `200` (format figé) :
```json
{
  "score": 90,
  "niveau": "élevé",
  "nbActifs": 6,
  "nbVulnerabilites": 5,
  "recommandations": [ "Mettre à jour les logiciels obsolètes ...", "..." ]
}
```

#### `POST /demo/load`
Vide puis charge la démo « Boréale Logistique » (6 actifs, 5 vulnérabilités).
→ `200` `{ message, entreprise, nbActifs, nbVulnerabilites }`.

#### `POST /demo/reset`
Vide toutes les données. → `200` `{ "message": "Données réinitialisées." }`.

---

## Moteur de calcul du risque

Le score utilise une **matrice de risque Gravité × Vraisemblance** (approche type EBIOS / ISO 27005),
calculée côté serveur. Chaque vulnérabilité est un scénario de risque :

- **Gravité** (impact) ← la `criticite` de la vulnérabilité : `faible`=1, `moyenne`=3, `élevée`=5.
- **Vraisemblance** (probabilité) ← l'actif : exposé Internet (3) ou interne (1), majoré selon
  le nombre de vulnérabilités qu'il porte (borné de 1 à 5).
- **Risque d'une vulnérabilité** = Gravité × Vraisemblance (de 1 à 25).

Grille 5×5 (valeur = Gravité × Vraisemblance) :

```
                       GRAVITÉ →
                  1    2    3    4    5
VRAIS. 5         5   10   15   20   25
       4         4    8   12   16   20
       3         3    6    9   12   15
       2         2    4    6    8   10
       1         1    2    3    4    5
```

Le **score global (0–100)** est piloté par le pire scénario détecté, majoré quand plusieurs
risques sérieux s'accumulent (l'ajout d'une vulnérabilité ne fait jamais baisser le score).

**Niveau** : `0–29 → faible` · `30–59 → moyen` · `60–100 → élevé`.

Les **recommandations** sont générées automatiquement selon ce qui est détecté (logiciels
obsolètes, mots de passe faibles, ports exposés, absence de sauvegarde, actifs trop exposés,
vulnérabilités élevées) + un message final selon le niveau.

---

## Tests

Suite de tests d'intégration couvrant toutes les routes (validation, erreurs, cascade, calcul du risque).

```bash
# Prérequis : MySQL lancé + schéma chargé
docker compose up -d
cd backend && npm run db:init

npm test
```

---

## Frontend

Application Vue.js 3 (Composition API) qui consomme l'API REST. Vue Router pour la
navigation, Pinia pour l'état, Chart.js pour les graphiques. Aucune dépendance UI :
le style est maison, piloté par des variables CSS (thème clair / sombre).

### Installation & exécution

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Script | Rôle |
|--------|------|
| `npm run dev` | Serveur de développement Vite (rechargement à chaud) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local |

> Le front appelle l'API sur `http://localhost:3000` : démarrer le backend en parallèle
> (ou, depuis la racine, `npm run dev` lance les deux à la fois via `concurrently`).

### Pages

| Route | Page | Rôle |
|-------|------|------|
| `/` | Accueil | Démarrer de zéro ou charger la démo « Boréale » |
| `/entreprise` | Entreprise | Créer / modifier la fiche (singleton) |
| `/actifs` | Actifs | Lister, ajouter, modifier, supprimer les actifs |
| `/vulnerabilites` | Vulnérabilités | Rattacher / supprimer les failles d'un actif |
| `/tableau-de-bord` | Tableau de bord | Score, niveau, jauge, 3 graphiques, recommandations |
| `/rapport` | Rapport | Synthèse imprimable / exportable en PDF |

### Organisation (`frontend/src/`)

- **`services/`** — couche données. `api.js` expose un point d'entrée unique ;
  `http.js` parle au vrai backend, `mock.js` est un repli hors-ligne en mémoire
  (reproduit validation, cascade et calcul du risque). Bascule via `USE_MOCK` dans
  `config.js`.
- **`stores/`** — stores Pinia (`company`, `assets`, `vulnerabilities`, `risk`) :
  chaque store gère `loading` / `error` et délègue à `api`.
- **`views/`** — une vue par page · **`components/`** — composants réutilisables
  (`BaseButton`, `BaseCard`, `BaseBadge`, `StatTile`, `ThemeToggle`).
- **`styles/`** — `tokens.css` (variables de thème) + `base.css` (reset + éléments natifs).

### Points notables

- **Dark mode** : bascule persistée (localStorage), appliquée avant le premier paint
  pour éviter tout flash.
- **Export PDF** : la page Rapport utilise `window.print()` + une feuille de style
  d'impression dédiée.
- **Responsive** : mise en page fluide, tables défilables sur petit écran.

