// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const pdfRoutes = require('./routes/pdfRoutes');
const authRoutes = require('./routes/authRoutes');
const requireAuth = require('./auth/requireAuth'); // 🔒 middleware

const { OUT_DIR } = require('./config/paths');

const app = express();
const PORT = process.env.PORT || 5000;

// Dominios permitidos (añade tu dominio de Vercel del frontend)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  // 'https://tu-frontend.vercel.app',
];

// CORS con credenciales (cookies)
app.use(cors({
  origin: (origin, cb) => {
    // permite Postman / curl (sin origin) y orígenes en la lista
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf'],
  credentials: true, // <- importante para cookies
}));

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Cookies
app.use(cookieParser());

// Carpeta de salida y estáticos (🔒 protegidos)
fs.mkdirSync(OUT_DIR, { recursive: true });
// Si quieres público, quita 'requireAuth' aquí:
app.use('/files', requireAuth, express.static(OUT_DIR));

// Rutas API
app.use('/api/auth', authRoutes);          // público: register/login/me/logout

// Todo lo de PDF queda protegido por sesión:
// (requireAuth se aplica a *todo* el router de PDF)
app.use('/api', pdfRoutes);

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('Error middleware:', err);
  const status = err.status || 400;
  res.status(status).json({ error: 'Request error', detail: err.message });
});

app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
