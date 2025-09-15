// api/index.js
const app = require('../server');   // importa el express app
const serverless = require('serverless-http');

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
