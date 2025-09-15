// backend/api/index.js
const app = require('../server');

// Express app es un handler (req, res) => ...  ✔
// Exporta función explícita para evitar dudas:
module.exports = (req, res) => app(req, res);
