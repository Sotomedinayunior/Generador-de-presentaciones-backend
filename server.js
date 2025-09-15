// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const pdfRoutes = require('./routes/pdfRoutes');
const authRoutes = require('./routes/authRoutes');
const requireAuth = require('./auth/requireAuth');

const { OUT_DIR } = require('./config/paths');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_VERCEL = !!process.env.VERCEL;

// ---- CORS ----
const EXPLICIT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];
if (process.env.FRONTEND_URL) EXPLICIT_ORIGINS.push(process.env.FRONTEND_URL);

// acepta cualquiera de *.vercel.app (deploys/preview/prod)
const VERCEL_REGEX = /^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i;

app.use(cors({
  origin: (origin, cb) => {
    // Requests sin origin (Postman/curl) o coinciden en listas => OK
    if (!origin ||
        EXPLICIT_ORIGINS.includes(origin) ||
        VERCEL_REGEX.test(origin)) {
      return cb(null, true);
    }
    return cb(null, false); // o cb(new Error('CORS not allowed'))
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf'],
  credentials: true, // <- para cookies
}));

// ---- Parsers & Cookies ----
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// ---- Archivos de salida (PDFs) ----
// En Vercel OUT_DIR será /tmp/files (escribible); en local ./files
try {
  fs.mkdirSync(OUT_DIR, { recursive: true });
} catch (e) {
  console.error('No pude crear OUT_DIR:', OUT_DIR, e.message);
}
// Servir PDFs generados (protegidos por sesión)
// Si quieres que sean públicos, quita `requireAuth`.
app.use('/files', requireAuth, express.static(OUT_DIR));

// ---- Rutas públicas de auth ----
app.use('/api/auth', authRoutes); // register, login, me, logout

// ---- Rutas protegidas (PDF) ----
app.use('/api', requireAuth, pdfRoutes);

// ---- Manejo de errores ----
app.use((err, req, res, next) => {
  console.error('Error middleware:', err);
  const status = err.status || 400;
  res.status(status).json({ error: 'Request error', detail: err.message });
});

// ---- Export / Listen según entorno ----
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

module.exports = app;