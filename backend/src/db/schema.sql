-- CyberTwin — création de la base. Cible MySQL 8.0.16+.
-- Lancement : npm run db:init (depuis backend/)

-- utf8mb4 obligatoire : sinon les accents (« élevée », « Pare-feu ») cassent en base.
DROP DATABASE IF EXISTS cybertwin;
CREATE DATABASE cybertwin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cybertwin;

-- USERS : comptes pour l'accès à l'application (auth JWT). passwordHash = bcrypt.
CREATE TABLE users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(64)  NOT NULL UNIQUE,   -- UNIQUE : un seul compte par identifiant
    passwordHash VARCHAR(255) NOT NULL,
    createdAt    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- COMPANIES : chaque utilisateur possède plusieurs entreprises (multi-entreprise).
-- Supprimer un compte supprime ses entreprises (et, en cascade, leurs actifs/vulns/historique).
CREATE TABLE companies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    userId          INT          NOT NULL,
    nom             VARCHAR(255) NOT NULL DEFAULT '',
    secteur         VARCHAR(255) NOT NULL DEFAULT '',
    nbEmployes      INT          NOT NULL DEFAULT 0,
    nbServeurs      INT          NOT NULL DEFAULT 0,
    nbPostes        INT          NOT NULL DEFAULT 0,
    servicesExposes JSON         NOT NULL,            -- tableau JSON : ["Site web", "VPN"]
    createdAt       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assets (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    companyId INT NOT NULL,                          -- entreprise propriétaire de l'actif
    nom       VARCHAR(255) NOT NULL,
    type      ENUM(                                  -- validation des types au niveau base
                'Serveur Web',
                'Base de données',
                'Poste utilisateur',
                'Routeur',
                'Pare-feu',
                'Application métier'
              ) NOT NULL,
    expose    BOOLEAN NOT NULL DEFAULT FALSE,         -- exposé sur Internet ?
    CONSTRAINT fk_asset_company
        FOREIGN KEY (companyId) REFERENCES companies(id)
        ON DELETE CASCADE      -- supprimer une entreprise supprime ses actifs (R3 étendue)
) ENGINE=InnoDB;

CREATE TABLE vulnerabilities (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    assetId   INT NOT NULL,
    nom       VARCHAR(255) NOT NULL,
    criticite ENUM('faible', 'moyenne', 'élevée') NOT NULL,
    CONSTRAINT fk_vuln_asset
        FOREIGN KEY (assetId) REFERENCES assets(id)
        ON DELETE CASCADE      -- supprimer un actif supprime aussi ses vulns (règle R3)
) ENGINE=InnoDB;

-- RISK_HISTORY : snapshots de risque enregistrés volontairement, par entreprise.
-- Le calcul du risque reste non stocké (R5) ; une ligne ici = une « analyse archivée ».
CREATE TABLE risk_history (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    companyId        INT         NOT NULL,
    score            INT         NOT NULL,
    niveau           VARCHAR(10) NOT NULL,
    nbActifs         INT         NOT NULL,
    nbVulnerabilites INT         NOT NULL,
    createdAt        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_company
        FOREIGN KEY (companyId) REFERENCES companies(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
