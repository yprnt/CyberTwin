-- CyberTwin — création de la base. Cible MySQL 8.0.16+ (CHECK appliqués).
-- Lancement : npm run db:init (depuis backend/)

-- utf8mb4 obligatoire : sinon les accents (« élevée », « Pare-feu ») cassent en base.
DROP DATABASE IF EXISTS cybertwin;
CREATE DATABASE cybertwin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cybertwin;

-- COMPANY : entreprise singleton (une seule ligne, id = 1)
CREATE TABLE company (
    id              INT PRIMARY KEY DEFAULT 1,
    nom             VARCHAR(255) NOT NULL DEFAULT '',
    secteur         VARCHAR(255) NOT NULL DEFAULT '',
    nbEmployes      INT          NOT NULL DEFAULT 0,
    nbServeurs      INT          NOT NULL DEFAULT 0,
    nbPostes        INT          NOT NULL DEFAULT 0,
    servicesExposes JSON         NOT NULL,            -- tableau JSON : ["Site web", "VPN"]
    CONSTRAINT chk_company_singleton CHECK (id = 1)   -- interdit une 2e entreprise
) ENGINE=InnoDB;

-- ligne vide de départ : GET /company renvoie ces valeurs tant que rien n'est saisi
INSERT INTO company (id, nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes)
VALUES (1, '', '', 0, 0, 0, JSON_ARRAY());

CREATE TABLE assets (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nom    VARCHAR(255) NOT NULL,
    type   ENUM(                                  -- validation des types au niveau base
                'Serveur Web',
                'Base de données',
                'Poste utilisateur',
                'Routeur',
                'Pare-feu',
                'Application métier'
           ) NOT NULL,
    expose BOOLEAN NOT NULL DEFAULT FALSE          -- exposé sur Internet ?
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
