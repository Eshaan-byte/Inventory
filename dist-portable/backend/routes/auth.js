const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');

// Check if setup is needed
router.get('/setup-status', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const companyExists = db.prepare('SELECT COUNT(*) as count FROM companies').get();

    res.json({
      success: true,
      data: {
        needs_setup: userCount.count === 0 || companyExists.count === 0,
        has_users: userCount.count > 0,
        has_company: companyExists.count > 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initial setup (create admin user)
router.post('/setup', (req, res) => {
  try {
    const { username, password, company_name } = req.body;

    if (!username || !password || !company_name) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and company name are required'
      });
    }

    // Check if already setup
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Setup already completed'
      });
    }

    // Create company
    db.prepare('INSERT INTO companies (name) VALUES (?)').run(company_name);

    // Create admin user
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, 'ADMIN')
    `).run(username, passwordHash);

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Setup completed successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is disabled'
      });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    // In a real app, you'd verify a JWT token here
    // For now, we'll just return a mock response
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          username: 'admin',
          role: 'ADMIN'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user (admin only)
router.post('/users', (req, res) => {
  try {
    const { username, password, role = 'OPERATOR' } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(username, passwordHash, role);

    const user = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, is_active, created_at, last_login FROM users').all();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
