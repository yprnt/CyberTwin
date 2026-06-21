-- =====================================================================
--  CyberTwin — Script de création de la base de données
--  Cible : MySQL 8.0+ (les CHECK ne sont réellement appliqués qu'en 8.0.16+)
--  Lancement :  npm run db:init   (depuis backend/)
-- =====================================================================

-- 1. Création de la base
--    utf8mb4 est OBLIGATOIRE ici : sans ça les accents ("élevée",
--    "Base de données", "Pare-feu") sont cassés en base.
DROP DATABASE IF EXISTS cybertwin;
CREATE DATABASE cybertwin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cybertwin;

-- =====================================================================
-- 2. Table COMPANY (entreprise — singleton : une seule ligne, id = 1)
-- =====================================================================
CREATE TABLE company (
    id              INT PRIMARY KEY DEFAULT 1,
    nom             VARCHAR(255) NOT NULL DEFAULT '',
    secteur         VARCHAR(255) NOT NULL DEFAULT '',
    nbEmployes      INT          NOT NULL DEFAULT 0,
    nbServeurs      INT          NOT NULL DEFAULT 0,
    nbPostes        INT          NOT NULL DEFAULT 0,
    servicesExposes JSON         NOT NULL,            -- tableau JSON : ["Site web", "VPN"]
    CONSTRAINT chk_company_singleton CHECK (id = 1)   -- interdit d'avoir 2 entreprises
) ENGINE=InnoDB;

-- Ligne vide de départ : GET /company renverra ces valeurs vides
-- tant que l'utilisateur n'a pas rempli le formulaire.
INSERT INTO company (id, nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes)
VALUES (1, '', '', 0, 0, 0, JSON_ARRAY());

-- =====================================================================
-- 3. Table ASSETS (actifs)
-- =====================================================================
CREATE TABLE assets (
    id     INT AUTO_INCREMENT PRIMARY KEY,        -- id auto-généré par MySQL
    nom    VARCHAR(255) NOT NULL,
    type   ENUM(                                  -- ENUM = validation au niveau base
                'Serveur Web',
                'Base de données',
                'Poste utilisateur',
                'Routeur',
                'Pare-feu',
                'Application métier'
           ) NOT NULL,
    expose BOOLEAN NOT NULL DEFAULT FALSE          -- exposé sur Internet ?
) ENGINE=InnoDB;

-- =====================================================================
-- 4. Table VULNERABILITIES (vulnérabilités)
-- =====================================================================
CREATE TABLE vulnerabilities (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    assetId   INT NOT NULL,
    nom       VARCHAR(255) NOT NULL,
    criticite ENUM('faible', 'moyenne', 'élevée') NOT NULL,
    CONSTRAINT fk_vuln_asset
        FOREIGN KEY (assetId) REFERENCES assets(id)
        ON DELETE CASCADE      -- supprimer un actif supprime AUSSI ses vulnérabilités
) ENGINE=InnoDB;

-- =====================================================================
--  Fin du script. Trois tables : company (1 ligne), assets, vulnerabilities.
-- =====================================================================
