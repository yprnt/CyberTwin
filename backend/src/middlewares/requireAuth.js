// Protège les routes métier : exige un JWT valide en en-tête Authorization.

const { verifyToken } = require('../services/token');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  // format attendu : "Bearer <token>"
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    // token expiré ou falsifié : on ne distingue pas, même réponse
    res.status(401).json({ message: 'Session invalide ou expirée. Reconnectez-vous.' });
  }
}

module.exports = requireAuth;
