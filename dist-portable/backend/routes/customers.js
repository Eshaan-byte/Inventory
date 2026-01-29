const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all customers
router.get('/', (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR gstin LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const customers = db.prepare(query).all(...params);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer by ID
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search customers (autocomplete)
router.get('/search/autocomplete', (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const customers = db.prepare(`
      SELECT id, name, phone, credit_limit
      FROM customers
      WHERE name LIKE ? OR phone LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `).all(`${q}%`, `${q}%`, parseInt(limit));

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create customer
router.post('/', (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      state,
      gstin,
      credit_limit = 0,
      opening_balance = 0,
      balance_type = 'DR'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const result = db.prepare(`
      INSERT INTO customers (
        name, phone, address, city, state, gstin,
        credit_limit, opening_balance, balance_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      phone?.trim(),
      address?.trim(),
      city?.trim(),
      state?.trim(),
      gstin?.trim(),
      credit_limit,
      opening_balance,
      balance_type
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, state, gstin, credit_limit } = req.body;

    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    db.prepare(`
      UPDATE customers SET
        name = ?,
        phone = ?,
        address = ?,
        city = ?,
        state = ?,
        gstin = ?,
        credit_limit = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, address, city, state, gstin, credit_limit, id);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
