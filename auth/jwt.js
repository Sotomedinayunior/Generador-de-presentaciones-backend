// auth/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TTL = process.env.JWT_TTL || '7d'; // válido 7 días

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,        // en prod debe ir sobre HTTPS (Vercel)
    sameSite: isProd ? 'none' : 'lax', // 'none' si frontend y backend en dominios distintos
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 días
  };
}

module.exports = { sign, verify, cookieOptions };
