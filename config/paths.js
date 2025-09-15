// config/paths.js
const path = require('path');

const TEMPLATE_PATH = path.join(process.cwd(), 'plantillas.pdf'); // empaquetado
const OUT_DIR = process.env.VERCEL
  ? '/tmp/files'                              // Vercel: sólo /tmp es escribible
  : path.join(process.cwd(), 'files');        // local

module.exports = { TEMPLATE_PATH, OUT_DIR };
