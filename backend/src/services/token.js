// Signature/vérification des JWT. Secret partagé ici pour éviter deux sources
// de vérité entre l'émission (auth.controller) et la vérification (requireAuth).

const jwt = require('jsonwebtoken');

// En production, refuser de démarrer sans secret explicite : un fallback connu
// (repo public) permettrait de forger n'importe quel jeton. Fallback en dev seulement.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET doit être défini en production.');
}
const SECRET = process.env.JWT_SECRET || 'dev-secret-cybertwin-change-me';
const EXPIRES_IN = '7d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
