// controllers/authController.js
const argon2 = require('argon2');
const { z } = require('zod');
const { sign, cookieOptions } = require('../auth/jwt');
const Users = require('../models/userRepo');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function register(req, res) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const exists = Users.findByEmail(email);
    if (exists) return res.status(409).json({ error: 'Ese email ya está registrado' });

    const password_hash = await argon2.hash(password);
    const id = Users.createUser({ email, password_hash, name });

    const token = sign({ sub: id, email, name });
    res.cookie('token', token, cookieOptions());
    res.status(201).json({ id, email, name });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: 'Datos inválidos', detail: e.issues });
    res.status(500).json({ error: 'No pude registrar', detail: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const u = Users.findByEmail(email);
    if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await argon2.verify(u.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = sign({ sub: u.id, email: u.email, name: u.name });
    res.cookie('token', token, cookieOptions());
    res.json({ id: u.id, email: u.email, name: u.name });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: 'Datos inválidos', detail: e.issues });
    res.status(500).json({ error: 'No pude iniciar sesión', detail: e.message });
  }
}

async function me(req, res) {
  res.json(req.user);
}

async function logout(req, res) {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
}

module.exports = { register, login, me, logout };
