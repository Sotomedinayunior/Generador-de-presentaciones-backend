// models/userRepo.js
const db = require('../db');

function findByEmail(email) {
  return db.prepare('SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?').get(email);
}

function findById(id) {
  return db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(id);
}

function createUser({ email, password_hash, name }) {
  const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
  const info = stmt.run(email, password_hash, name || null);
  return info.lastInsertRowid;
}

module.exports = { findByEmail, findById, createUser };
