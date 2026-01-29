const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all purchase invoices
router.get('/', (req, res) => {
  try {
    const { from_date, to_date, supplier_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        pi.*,
        s.name as supplier_name
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ' AND pi.invoice_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND pi.invoice_date <= ?';
      params.push(to_date);
    }

    if (supplier_id) {
      query += ' AND pi.supplier_id = ?';
      params.push(supplier_id);
    }

    query += ' ORDER BY pi.invoice_date DESC, pi.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const invoices = db.prepare(query).all(...params);

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get purchase invoice by ID with items
router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT pi.*, s.name as supplier_name, s.gstin as supplier_gstin
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      WHERE pi.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const items = db.prepare(`
      SELECT
        pii.*,
        m.name as medicine_name,
        m.manufacturer,
        b.batch_number,
        b.expiry_date
      FROM purchase_invoice_items pii
      JOIN medicines m ON pii.medicine_id = m.id
      JOIN batches b ON pii.batch_id = b.id
      WHERE pii.purchase_invoice_id = ?
    `).all(req.params.id);

    res.json({
      success: true,
      data: { invoice, items }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create purchase invoice
router.post('/', (req, res) => {
  const transaction = db.transaction((invoiceData) => {
    const {
      invoice_no,
      invoice_date,
      supplier_id,
      items,
      created_by
    } = invoiceData;

    // Validation
    if (!invoice_no || !invoice_date || !supplier_id || !items || items.length === 0) {
      throw new Error('Invoice number, date, supplier, and items are required');
    }

    // Calculate totals
    let total_amount = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;

    // Insert or update batches first
    const batchIds = [];

    for (const item of items) {
      if (!item.medicine_id || !item.batch_number || !item.expiry_date || !item.quantity || !item.purchase_rate || !item.mrp) {
        throw new Error('Invalid item data');
      }

      // Check if batch exists
      let batch = db.prepare(
        'SELECT * FROM batches WHERE medicine_id = ? AND batch_number = ?'
      ).get(item.medicine_id, item.batch_number);

      let batchId;

      if (batch) {
        // Update existing batch
        db.prepare(`
          UPDATE batches
          SET quantity_in_stock = quantity_in_stock + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.quantity + (item.free_quantity || 0), batch.id);
        batchId = batch.id;
      } else {
        // Create new batch
        const batchResult = db.prepare(`
          INSERT INTO batches (
            medicine_id, batch_number, expiry_date, purchase_rate,
            mrp, ptr, quantity_in_stock, supplier_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          item.medicine_id,
          item.batch_number,
          item.expiry_date,
          item.purchase_rate,
          item.mrp,
          item.ptr || item.mrp,
          item.quantity + (item.free_quantity || 0),
          supplier_id
        );
        batchId = batchResult.lastInsertRowid;
      }

      batchIds.push({ ...item, batch_id: batchId });

      // Calculate item totals
      const itemTotal = item.quantity * item.purchase_rate;
      const discountAmt = (itemTotal * (item.discount_percentage || 0)) / 100;
      const taxableAmount = itemTotal - discountAmt;
      const gstAmt = (taxableAmount * item.gst_percentage) / 100;

      total_amount += taxableAmount;
      cgst_amount += gstAmt / 2;
      sgst_amount += gstAmt / 2;
    }

    const net_amount = total_amount + cgst_amount + sgst_amount + igst_amount;
    const round_off = Math.round(net_amount) - net_amount;
    const final_amount = Math.round(net_amount);

    // Insert invoice
    const invoiceResult = db.prepare(`
      INSERT INTO purchase_invoices (
        invoice_no, invoice_date, supplier_id,
        total_amount, cgst_amount, sgst_amount, igst_amount,
        round_off, net_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoice_no,
      invoice_date,
      supplier_id,
      total_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      round_off,
      final_amount,
      created_by
    );

    const invoiceId = invoiceResult.lastInsertRowid;

    // Update batches with purchase_invoice_id
    for (const item of batchIds) {
      db.prepare('UPDATE batches SET purchase_invoice_id = ? WHERE id = ?')
        .run(invoiceId, item.batch_id);
    }

    // Insert items
    for (const item of batchIds) {
      const itemTotal = item.quantity * item.purchase_rate;
      const discountAmt = (itemTotal * (item.discount_percentage || 0)) / 100;
      const taxableAmount = itemTotal - discountAmt;
      const gstAmt = (taxableAmount * item.gst_percentage) / 100;

      db.prepare(`
        INSERT INTO purchase_invoice_items (
          purchase_invoice_id, medicine_id, batch_id, quantity, free_quantity,
          purchase_rate, mrp, ptr, discount_percentage, gst_percentage,
          cgst_amount, sgst_amount, igst_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        item.medicine_id,
        item.batch_id,
        item.quantity,
        item.free_quantity || 0,
        item.purchase_rate,
        item.mrp,
        item.ptr || item.mrp,
        item.discount_percentage || 0,
        item.gst_percentage,
        gstAmt / 2,
        gstAmt / 2,
        0,
        taxableAmount + gstAmt
      );
    }

    return invoiceId;
  });

  try {
    const invoiceId = transaction(req.body);

    const invoice = db.prepare(`
      SELECT pi.*, s.name as supplier_name
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      WHERE pi.id = ?
    `).get(invoiceId);

    const items = db.prepare(`
      SELECT
        pii.*,
        m.name as medicine_name,
        m.manufacturer,
        b.batch_number,
        b.expiry_date
      FROM purchase_invoice_items pii
      JOIN medicines m ON pii.medicine_id = m.id
      JOIN batches b ON pii.batch_id = b.id
      WHERE pii.purchase_invoice_id = ?
    `).all(invoiceId);

    res.status(201).json({
      success: true,
      message: 'Purchase invoice created successfully',
      data: { invoice, items }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
