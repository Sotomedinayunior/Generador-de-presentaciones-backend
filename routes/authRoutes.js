// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../auth/requireAuth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.post('/logout', ctrl.logout);

module.exports = router;
