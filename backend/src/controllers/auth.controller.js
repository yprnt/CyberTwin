// Authentification : inscription, connexion, profil courant. Mots de passe
// hachés en bcrypt ; le jeton renvoyé sert ensuite d'en-tête Authorization.

const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken } = require('../services/token');

const PASSWORD_MIN = 6;
const BCRYPT_ROUNDS = 10;

// Identifiants saisis : on normalise le username, on garde le password tel quel.
function lireIdentifiants(body) {
  const b = body || {};
  return {
    username: typeof b.username === 'string' ? b.username.trim() : '',
    password: typeof b.password === 'string' ? b.password : '',
  };
}

async function register(req, res) {
  const { username, password } = lireIdentifiants(req.body);

  if (!username || !password) {
    return res.status(400).json({ message: "Nom d'utilisateur et mot de passe sont obligatoires." });
  }
  if (password.length < PASSWORD_MIN) {
    return res
      .status(400)
      .json({ message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.` });
  }

  try {
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Ce nom d’utilisateur est déjà pris.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (username, passwordHash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const user = { id: result.insertId, username };
    res.status(201).json({ token: signToken(user), user: { username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}

async function login(req, res) {
  const { username, password } = lireIdentifiants(req.body);

  if (!username || !password) {
    return res.status(400).json({ message: "Nom d'utilisateur et mot de passe sont obligatoires." });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, passwordHash FROM users WHERE username = ?',
      [username]
    );
    const row = rows[0];

    // Même réponse si l'utilisateur est inconnu ou si le mot de passe est faux :
    // ne pas révéler lequel des deux est en cause.
    const ok = row && (await bcrypt.compare(password, row.passwordHash));
    if (!ok) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const user = { id: row.id, username: row.username };
    res.json({ token: signToken(user), user: { username: row.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
}

// req.user posé par requireAuth : permet au front de valider un token au démarrage.
function me(req, res) {
  res.json({ user: { username: req.user.username } });
}

module.exports = { register, login, me };
