const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all batches for a medicine
router.get('/medicine/:medicineId', (req, res) => {
  try {
    const { medicineId } = req.params;

    const batches = db.prepare(`
      SELECT b.*, m.name as medicine_name, s.name as supplier_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.medicine_id = ?
      ORDER BY b.expiry_date ASC
    `).all(medicineId);

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available batches for a medicine (for billing)
router.get('/medicine/:medicineId/available', (req, res) => {
  try {
    const { medicineId } = req.params;

    const batches = db.prepare(`
      SELECT
        b.*,
        m.name as medicine_name,
        m.gst_percentage,
        CAST((julianday(b.expiry_date) - julianday('now')) AS INTEGER) as days_to_expiry,
        CASE
          WHEN b.expiry_date <= date('now') THEN 'EXPIRED'
          WHEN b.expiry_date <= date('now', '+90 days') THEN 'NEAR_EXPIRY'
          ELSE 'VALID'
        END as expiry_status
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.medicine_id = ?
        AND b.quantity_in_stock > 0
        AND b.expiry_date > date('now')
      ORDER BY b.expiry_date ASC, b.created_at ASC
    `).all(medicineId);

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch by ID
router.get('/:id', (req, res) => {
  try {
    const batch = db.prepare(`
      SELECT b.*, m.name as medicine_name, s.name as supplier_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new batch
router.post('/', (req, res) => {
  try {
    const {
      medicine_id,
      batch_number,
      expiry_date,
      purchase_rate,
      mrp,
      ptr,
      quantity_in_stock,
      supplier_id,
      purchase_invoice_id
    } = req.body;

    // Validation
    if (!medicine_id || !batch_number || !expiry_date || !purchase_rate || !mrp) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: medicine_id, batch_number, expiry_date, purchase_rate, mrp'
      });
    }

    // Check if batch already exists
    const existing = db.prepare(
      'SELECT id FROM batches WHERE medicine_id = ? AND batch_number = ?'
    ).get(medicine_id, batch_number);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Batch already exists for this medicine'
      });
    }

    const result = db.prepare(`
      INSERT INTO batches (
        medicine_id, batch_number, expiry_date, purchase_rate,
        mrp, ptr, quantity_in_stock, supplier_id, purchase_invoice_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      medicine_id,
      batch_number,
      expiry_date,
      purchase_rate,
      mrp,
      ptr || mrp,
      quantity_in_stock || 0,
      supplier_id,
      purchase_invoice_id
    );

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update batch stock (for purchase/sales)
router.patch('/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'ADD' or 'SUBTRACT'

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        error: 'quantity and operation are required'
      });
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    let newStock;
    let soldQty = batch.quantity_sold;

    if (operation === 'ADD') {
      newStock = batch.quantity_in_stock + quantity;
    } else if (operation === 'SUBTRACT') {
      newStock = batch.quantity_in_stock - quantity;
      soldQty = batch.quantity_sold + quantity;

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation. Use ADD or SUBTRACT'
      });
    }

    db.prepare(`
      UPDATE batches
      SET quantity_in_stock = ?,
          quantity_sold = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStock, soldQty, id);

    const updated = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update batch details
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expiry_date, purchase_rate, mrp, ptr } = req.body;

    const existing = db.prepare('SELECT id FROM batches WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    db.prepare(`
      UPDATE batches SET
        expiry_date = ?,
        purchase_rate = ?,
        mrp = ?,
        ptr = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(expiry_date, purchase_rate, mrp, ptr, id);

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expiry alerts
router.get('/alerts/expiry', (req, res) => {
  try {
    const { days = 90 } = req.query;

    const alerts = db.prepare(`
      SELECT * FROM v_expiry_alerts
      WHERE days_to_expiry <= ?
      ORDER BY days_to_expiry ASC
    `).all(days);

    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expired stock
router.get('/alerts/expired', (req, res) => {
  try {
    const expired = db.prepare('SELECT * FROM v_expired_stock').all();

    res.json({ success: true, data: expired });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
