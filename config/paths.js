// config/paths.js
const path = require('path');

const ROOT = process.cwd();                         // raíz del bundle
const IS_SERVERLESS = !!process.env.VERCEL;         // Vercel/Lambda

// Asegúrate que "plantillas.pdf" esté en el repo y no ignorado
const TEMPLATE_PATH = path.join(ROOT, 'plantillas.pdf');

// En Vercel escribir SIEMPRE en /tmp; en local usa ./files
const OUT_DIR = IS_SERVERLESS
  ? '/tmp/files'
  : path.join(ROOT, 'files');

module.exports = { TEMPLATE_PATH, OUT_DIR, IS_SERVERLESS };
