const path = require('path');

const ROOT = process.cwd();
// si corres en Vercel o en serverless, usa /tmp (es la única escribible)
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.NOW_REGION;

const TEMPLATE_PATH = path.join(ROOT, 'plantillas.pdf'); // asegúrate de que el archivo se sube al repo
const OUT_DIR = IS_SERVERLESS ? '/tmp/files' : path.join(ROOT, 'files');

module.exports = { TEMPLATE_PATH, OUT_DIR };
