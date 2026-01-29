const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all medicines (with optional search)
router.get('/', (req, res) => {
  try {
    const { search, active_only = '1' } = req.query;

    let query = 'SELECT * FROM medicines WHERE 1=1';
    const params = [];

    if (active_only === '1') {
      query += ' AND is_active = 1';
    }

    if (search) {
      query += ' AND (name LIKE ? OR salt_composition LIKE ? OR manufacturer LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const medicines = db.prepare(query).all(...params);
    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get medicine by ID
router.get('/:id', (req, res) => {
  try {
    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search medicines by name (fast autocomplete)
router.get('/search/autocomplete', (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const medicines = db.prepare(`
      SELECT id, name, salt_composition, manufacturer, gst_percentage
      FROM medicines
      WHERE is_active = 1
        AND (name LIKE ? OR salt_composition LIKE ?)
      ORDER BY name ASC
      LIMIT ?
    `).all(`${q}%`, `${q}%`, parseInt(limit));

    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check for duplicate medicine by salt composition
router.post('/check-duplicate', (req, res) => {
  try {
    const { salt_composition, exclude_id } = req.body;

    let query = 'SELECT id, name, manufacturer FROM medicines WHERE salt_composition = ? AND is_active = 1';
    const params = [salt_composition];

    if (exclude_id) {
      query += ' AND id != ?';
      params.push(exclude_id);
    }

    const duplicates = db.prepare(query).all(...params);

    res.json({
      success: true,
      has_duplicates: duplicates.length > 0,
      duplicates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new medicine
router.post('/', (req, res) => {
  try {
    const {
      name,
      salt_composition,
      manufacturer,
      schedule = 'NONE',
      hsn_code,
      gst_percentage = 12.0,
      rack_location,
      unit = 'STRIP'
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Medicine name is required' });
    }

    const result = db.prepare(`
      INSERT INTO medicines (
        name, salt_composition, manufacturer, schedule,
        hsn_code, gst_percentage, rack_location, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      salt_composition?.trim(),
      manufacturer?.trim(),
      schedule,
      hsn_code?.trim(),
      gst_percentage,
      rack_location?.trim(),
      unit
    );

    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update medicine
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      salt_composition,
      manufacturer,
      schedule,
      hsn_code,
      gst_percentage,
      rack_location,
      unit
    } = req.body;

    // Check if medicine exists
    const existing = db.prepare('SELECT id FROM medicines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    db.prepare(`
      UPDATE medicines SET
        name = ?,
        salt_composition = ?,
        manufacturer = ?,
        schedule = ?,
        hsn_code = ?,
        gst_percentage = ?,
        rack_location = ?,
        unit = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      salt_composition,
      manufacturer,
      schedule,
      hsn_code,
      gst_percentage,
      rack_location,
      unit,
      id
    );

    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete (soft delete) medicine
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if medicine exists
    const existing = db.prepare('SELECT id FROM medicines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    // Check if medicine has stock
    const hasStock = db.prepare(
      'SELECT COUNT(*) as count FROM batches WHERE medicine_id = ? AND quantity_in_stock > 0'
    ).get(id);

    if (hasStock.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete medicine with existing stock'
      });
    }

    // Soft delete
    db.prepare('UPDATE medicines SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
