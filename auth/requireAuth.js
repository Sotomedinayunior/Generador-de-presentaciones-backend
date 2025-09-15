// auth/requireAuth.js
const { verify } = require('./jwt');

module.exports = function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    const payload = verify(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name || null };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
