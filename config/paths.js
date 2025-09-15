// backend/config/paths.js
const path = require('path');

const isVercel = !!process.env.VERCEL;
const ROOT = process.cwd(); // será /var/task en Vercel

const TEMPLATE_PATH = path.join(ROOT, 'plantillas.pdf');
const OUT_DIR = isVercel ? '/tmp' : path.join(ROOT, 'files');

module.exports = { TEMPLATE_PATH, OUT_DIR };
