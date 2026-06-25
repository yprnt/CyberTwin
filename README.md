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
npm run db:init               # crée les 5 tables (destructif : repart de zéro)
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
| `JWT_SECRET` | dev-secret… | Clé de signature des jetons d'authentification (**à changer en production**) |

---

## Base de données

5 tables (encodage **utf8mb4** obligatoire pour les accents) :

- **`users`** — comptes d'accès (authentification) ; mot de passe haché en bcrypt.
- **`companies`** — entreprises ; **multi-entreprise** : `userId` (FK → `users`, `ON DELETE CASCADE`)
  rattache chaque entreprise à un compte qui peut en posséder plusieurs.
- **`assets`** — actifs ; `companyId` (FK → `companies`, `ON DELETE CASCADE`) ; `type` ENUM des
  6 valeurs autorisées ; `expose` booléen.
- **`vulnerabilities`** — vulnérabilités ; `criticite` ENUM `faible/moyenne/élevée` ;
  clé étrangère vers `assets` avec **`ON DELETE CASCADE`** (supprimer un actif supprime ses vulns).
- **`risk_history`** — analyses archivées (snapshots) par entreprise ; `companyId`
  (FK → `companies`, `ON DELETE CASCADE`).

Supprimer une entreprise efface en cascade ses actifs, vulnérabilités et historique.
Les données sont persistées en base (volume Docker). `npm run db:init` repart de zéro.

---

## Documentation de l'API REST

URL de base : `http://localhost:3000` · Échanges **JSON** · **CORS** activé.

**Codes HTTP** : `200` OK · `201` Créé · `400` requête invalide · `401` non authentifié ·
`404` introuvable · `409` conflit.
**Format d'erreur** (toujours identique) : `{ "message": "..." }`.

**Authentification** : sauf `GET /` et les routes `/auth/*`, **toutes les routes exigent un jeton**
JWT dans l'en-tête `Authorization: Bearer <token>` (sinon `401`). Le jeton est obtenu via
`/auth/register` ou `/auth/login`.

Les ressources d'une entreprise sont **imbriquées** sous `/companies/:companyId/…`.
Chaque accès vérifie que l'entreprise appartient au compte du jeton, sinon `404`.

| Méthode | Route | Rôle | Auth |
|---------|-------|------|------|
| GET | `/` | Health check | — |
| POST | `/auth/register` | Créer un compte → `{ token, user }` | — |
| POST | `/auth/login` | Se connecter → `{ token, user }` | — |
| GET | `/auth/me` | Profil du compte courant | 🔒 |
| GET | `/companies` | Lister mes entreprises | 🔒 |
| POST | `/companies` | Créer une entreprise | 🔒 |
| GET | `/companies/:id` | Lire une entreprise | 🔒 |
| PUT | `/companies/:id` | Modifier une entreprise | 🔒 |
| DELETE | `/companies/:id` | Supprimer une entreprise (+ actifs/vulns/historique) | 🔒 |
| GET | `/companies/:id/assets` | Lister les actifs | 🔒 |
| POST | `/companies/:id/assets` | Ajouter un actif | 🔒 |
| PUT | `/companies/:id/assets/:assetId` | Modifier un actif | 🔒 |
| DELETE | `/companies/:id/assets/:assetId` | Supprimer un actif (+ ses vulnérabilités) | 🔒 |
| GET | `/companies/:id/vulnerabilities` | Lister les vulnérabilités | 🔒 |
| POST | `/companies/:id/vulnerabilities` | Ajouter une vulnérabilité | 🔒 |
| DELETE | `/companies/:id/vulnerabilities/:vulnId` | Supprimer une vulnérabilité | 🔒 |
| POST | `/companies/:id/risk/calculate` | Calculer le score et le niveau de risque | 🔒 |
| POST | `/companies/:id/risk/snapshot` | Archiver l'analyse courante | 🔒 |
| GET | `/companies/:id/risk/history` | Lister les analyses archivées | 🔒 |
| DELETE | `/companies/:id/risk/history` | Vider l'historique | 🔒 |
| POST | `/demo/load` | Créer une entreprise de démonstration « Boréale » | 🔒 |

### Détail des routes

#### `GET /` — health check
→ `200` `{ "status": "ok", "service": "CyberTwin API" }`

#### `GET /companies` · `POST /companies`
Liste les entreprises du compte / en crée une. `POST` reçoit un objet entreprise (sans `id`) ;
champs obligatoires : `nom`, `secteur`, les effectifs (`nbEmployes`, `nbServeurs`, `nbPostes` —
entiers positifs ou nuls, `0` accepté) et au moins un service dans `servicesExposes`.
→ `201` entreprise créée (avec `id`) · `400` si un champ requis manque.
```json
{ "id": 1, "nom": "Boréale Logistique", "secteur": "Transport et logistique",
  "nbEmployes": 48, "nbServeurs": 6, "nbPostes": 35,
  "servicesExposes": ["Site web", "VPN"], "createdAt": "..." }
```

#### `GET|PUT|DELETE /companies/:id`
Lire / modifier / supprimer une entreprise du compte. → `404` si elle n'existe pas ou
appartient à un autre compte. `DELETE` supprime en cascade actifs, vulnérabilités et historique.

#### `GET|POST /companies/:id/assets` · `PUT|DELETE /companies/:id/assets/:assetId`
`POST` reçoit `{ nom, type, expose? }` (sans `id`). `type` ∈ des 6 valeurs autorisées :
`Serveur Web`, `Base de données`, `Poste utilisateur`, `Routeur`, `Pare-feu`, `Application métier`.
→ `201` actif créé · `400` nom/type manquant ou type non autorisé · `404` actif/entreprise inconnu.
`DELETE` supprime aussi les vulnérabilités de l'actif (cascade R3).

#### `GET|POST /companies/:id/vulnerabilities` · `DELETE /companies/:id/vulnerabilities/:vulnId`
`POST` reçoit `{ assetId, nom, criticite }` ; `criticite` ∈ `faible|moyenne|élevée` ; l'actif
doit appartenir à l'entreprise. → `201` · `400` criticité invalide · `404` actif hors entreprise.

#### `POST /companies/:id/risk/calculate`
**Body vide.** Calcule à partir de l'état courant de l'entreprise.
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

#### `POST /companies/:id/risk/snapshot` · `GET|DELETE /companies/:id/risk/history`
`snapshot` archive le risque courant (→ `201`). `GET history` liste les snapshots,
`DELETE history` les vide.

#### `POST /demo/load`
Crée une entreprise de démonstration « Boréale Logistique » (6 actifs, 5 vulnérabilités)
pour le compte courant. → `201` l'entreprise créée `{ id, nom, …, nbActifs, nbVulnerabilites }`.

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

Les pages d'une entreprise sont imbriquées sous `/entreprises/:id/…` ; un layout
(`CompanyLayout`) charge l'entreprise et affiche sa sous-navigation.

| Route | Page | Rôle |
|-------|------|------|
| `/login` | Connexion | Connexion / inscription (accès public) |
| `/` | Accueil | Présentation + accès aux entreprises / démo |
| `/entreprises` | Mes entreprises | Lister, créer, ouvrir, supprimer ; charger la démo |
| `/entreprises/nouveau` | Création | Formulaire de création d'une entreprise |
| `/entreprises/:id` | Tableau de bord | Score, niveau, jauge, 3 graphiques, recommandations, enregistrement d'analyse |
| `/entreprises/:id/fiche` | Fiche | Modifier l'entreprise |
| `/entreprises/:id/actifs` | Actifs | Lister, ajouter, modifier, supprimer les actifs |
| `/entreprises/:id/vulnerabilites` | Vulnérabilités | Rattacher / supprimer les failles d'un actif |
| `/entreprises/:id/historique` | Historique | Courbe d'évolution du score + analyses archivées |
| `/entreprises/:id/rapport` | Rapport | Synthèse imprimable / exportable en PDF |

> Toutes les pages sauf `/login` sont protégées : une garde de navigation redirige
> vers la connexion tant qu'aucun jeton n'est présent.

### Organisation (`frontend/src/`)

- **`services/`** — couche données. `api.js` expose un point d'entrée unique ;
  `http.js` parle au vrai backend, `mock.js` est un repli hors-ligne en mémoire
  (reproduit validation, cascade et calcul du risque). Bascule via `USE_MOCK` dans
  `config.js`.
- **`stores/`** — stores Pinia (`auth`, `companies`, `assets`, `vulnerabilities`, `risk`) :
  chaque store gère `loading` / `error` et délègue à `api`. Les stores actifs/vulns/risque
  reçoivent le `companyId` (lu dans l'URL) — pas d'entreprise « active » cachée.
- **`views/`** — une vue par page · **`layouts/`** — `CompanyLayout` (contexte d'une
  entreprise) · **`components/`** — composants réutilisables
  (`BaseButton`, `BaseCard`, `BaseBadge`, `StatTile`, `ThemeToggle`, `ToastHost`).
- **`composables/`** — `useTheme` (dark mode) et `useToasts` (notifications).
- **`styles/`** — `tokens.css` (variables de thème) + `base.css` (reset + éléments natifs).

### Points notables

- **Dark mode** : bascule persistée (localStorage), appliquée avant le premier paint
  pour éviter tout flash.
- **Export PDF** : la page Rapport utilise `window.print()` + une feuille de style
  d'impression dédiée.
- **Responsive** : mise en page fluide, tables défilables sur petit écran.

### Fonctionnalités bonus

- **Multi-entreprises** : un compte possède plusieurs entreprises, chacune avec ses
  propres actifs, vulnérabilités, calcul de risque et historique. Données isolées par
  compte (vérifiées côté API) ; API REST imbriquée `/companies/:id/…` ; côté front,
  l'entreprise est portée par l'URL (`/entreprises/:id/…`).
- **Authentification** : connexion / inscription par jeton JWT (bcrypt côté serveur).
  Le jeton est stocké dans `localStorage` et joint automatiquement à chaque appel ;
  une garde de route verrouille toute l'application. Store `auth`, page `/login`.
- **Historique des analyses** : depuis le tableau de bord, « Enregistrer l'analyse »
  archive un snapshot (`/risk/snapshot`). La page Historique trace l'évolution du
  score (Chart.js) et liste les analyses.
- **Notifications** : toasts in-app (succès / erreur) sur les actions courantes
  (composable `useToasts` + composant `ToastHost`, sans dépendance).
- **Dark mode** · **Export PDF** (page Rapport) : voir ci-dessus.

Le mock hors-ligne (`USE_MOCK`) reproduit aussi le multi-entreprise, l'authentification
et l'historique.

