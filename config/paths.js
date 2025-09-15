//config/paths.js

const path = require('path');

const TEMPLATE_PATH = path.resolve(__dirname, '../plantillas.pdf');
const OUT_DIR = path.resolve(__dirname, '../files');

module.exports = {
  TEMPLATE_PATH,
  OUT_DIR
};
