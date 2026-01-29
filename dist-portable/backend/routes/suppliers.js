const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all suppliers
router.get('/', (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR gstin LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const suppliers = db.prepare(query).all(...params);
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supplier by ID
router.get('/:id', (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);

    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create supplier
router.post('/', (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      gstin,
      phone,
      email,
      opening_balance = 0,
      balance_type = 'CR'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Supplier name is required' });
    }

    const result = db.prepare(`
      INSERT INTO suppliers (
        name, address, city, state, gstin, phone, email,
        opening_balance, balance_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      address?.trim(),
      city?.trim(),
      state?.trim(),
      gstin?.trim(),
      phone?.trim(),
      email?.trim(),
      opening_balance,
      balance_type
    );

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update supplier
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, gstin, phone, email } = req.body;

    const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    db.prepare(`
      UPDATE suppliers SET
        name = ?,
        address = ?,
        city = ?,
        state = ?,
        gstin = ?,
        phone = ?,
        email = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, address, city, state, gstin, phone, email, id);

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
