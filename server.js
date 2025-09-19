const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const pdfRoutes = require('./routes/pdfRoutes');
const authRoutes = require('./routes/authRoutes');
// const requireAuth = require('./auth/requireAuth'); // si quieres proteger todo
const { OUT_DIR } = require('./config/paths');

const app = express();

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  // 'https://tu-frontend.vercel.app',
];
app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin)) ? cb(null, true) : cb(null, false),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf'],
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Archivos estáticos
fs.mkdirSync(OUT_DIR, { recursive: true });
// app.use('/files', requireAuth, express.static(OUT_DIR)); // si quieres proteger
app.use('/files', express.static(OUT_DIR));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);

// Errores
app.use((err, req, res, next) => {
  console.error('Error middleware:', err);
  res.status(err.status || 500).json({ error: 'Request error', detail: err.message });
});
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Servidor escuchando en http://localhost:${PORT}`);
// });


module.exports = app;
