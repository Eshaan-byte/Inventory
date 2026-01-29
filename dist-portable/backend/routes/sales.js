const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all sales invoices
router.get('/', (req, res) => {
  try {
    const { from_date, to_date, customer_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        si.*,
        c.name as customer_name,
        u.username as created_by_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      LEFT JOIN users u ON si.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ' AND si.invoice_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND si.invoice_date <= ?';
      params.push(to_date);
    }

    if (customer_id) {
      query += ' AND si.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY si.invoice_date DESC, si.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const invoices = db.prepare(query).all(...params);

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sales invoice by ID with items
router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.gstin as customer_gstin,
        u.username as created_by_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      LEFT JOIN users u ON si.created_by = u.id
      WHERE si.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const items = db.prepare(`
      SELECT
        sii.*,
        m.name as medicine_name,
        m.manufacturer,
        b.batch_number,
        b.expiry_date
      FROM sales_invoice_items sii
      JOIN medicines m ON sii.medicine_id = m.id
      JOIN batches b ON sii.batch_id = b.id
      WHERE sii.sales_invoice_id = ?
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        invoice,
        items
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate next invoice number
router.get('/generate/invoice-number', (req, res) => {
  try {
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'invoice_prefix'").get();
    const prefix = settings?.value || 'INV';

    const lastInvoice = db.prepare(
      'SELECT invoice_no FROM sales_invoices ORDER BY id DESC LIMIT 1'
    ).get();

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoice_no.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const invoiceNo = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    res.json({
      success: true,
      data: { invoice_no: invoiceNo }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create sales invoice (BILLING - CRITICAL OPERATION)
router.post('/', (req, res) => {
  const transaction = db.transaction((invoiceData) => {
    const {
      invoice_no,
      invoice_date,
      customer_id,
      payment_mode = 'CASH',
      items,
      created_by
    } = invoiceData;

    // Validation
    if (!invoice_no || !invoice_date || !items || items.length === 0) {
      throw new Error('Invoice number, date, and items are required');
    }

    // Calculate totals
    let total_amount = 0;
    let discount_amount = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;

    // Validate items and check stock
    for (const item of items) {
      if (!item.medicine_id || !item.batch_id || !item.quantity || !item.sale_rate) {
        throw new Error('Invalid item data');
      }

      // Check batch stock availability
      const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(item.batch_id);

      if (!batch) {
        throw new Error(`Batch not found for item`);
      }

      if (batch.quantity_in_stock < item.quantity) {
        const medicine = db.prepare('SELECT name FROM medicines WHERE id = ?').get(item.medicine_id);
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${batch.quantity_in_stock}`);
      }

      // Check expiry
      const expiryDate = new Date(batch.expiry_date);
      const today = new Date();
      if (expiryDate <= today) {
        const medicine = db.prepare('SELECT name FROM medicines WHERE id = ?').get(item.medicine_id);
        throw new Error(`Cannot sell expired medicine: ${medicine.name} (Batch: ${batch.batch_number})`);
      }

      // Calculate item totals
      const itemTotal = item.quantity * item.sale_rate;
      const discountAmt = (itemTotal * (item.discount_percentage || 0)) / 100;
      const taxableAmount = itemTotal - discountAmt;
      const gstAmt = (taxableAmount * item.gst_percentage) / 100;

      total_amount += taxableAmount;
      discount_amount += discountAmt;

      // Assume intra-state (CGST + SGST)
      cgst_amount += gstAmt / 2;
      sgst_amount += gstAmt / 2;
    }

    const net_amount = total_amount + cgst_amount + sgst_amount + igst_amount;
    const round_off = Math.round(net_amount) - net_amount;
    const final_amount = Math.round(net_amount);

    // Insert invoice
    const invoiceResult = db.prepare(`
      INSERT INTO sales_invoices (
        invoice_no, invoice_date, customer_id, payment_mode,
        total_amount, discount_amount, cgst_amount, sgst_amount,
        igst_amount, round_off, net_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoice_no,
      invoice_date,
      customer_id,
      payment_mode,
      total_amount,
      discount_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      round_off,
      final_amount,
      created_by
    );

    const invoiceId = invoiceResult.lastInsertRowid;

    // Insert items and update stock
    for (const item of items) {
      const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(item.batch_id);

      const itemTotal = item.quantity * item.sale_rate;
      const discountAmt = (itemTotal * (item.discount_percentage || 0)) / 100;
      const taxableAmount = itemTotal - discountAmt;
      const gstAmt = (taxableAmount * item.gst_percentage) / 100;

      const margin_amount = (item.sale_rate - batch.purchase_rate) * item.quantity;
      const margin_percentage = ((item.sale_rate - batch.purchase_rate) / batch.purchase_rate) * 100;

      // Insert item
      db.prepare(`
        INSERT INTO sales_invoice_items (
          sales_invoice_id, medicine_id, batch_id, quantity, sale_rate,
          mrp, discount_percentage, gst_percentage, cgst_amount, sgst_amount,
          igst_amount, total_amount, margin_amount, margin_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        item.medicine_id,
        item.batch_id,
        item.quantity,
        item.sale_rate,
        item.mrp || batch.mrp,
        item.discount_percentage || 0,
        item.gst_percentage,
        gstAmt / 2,
        gstAmt / 2,
        0,
        taxableAmount + gstAmt,
        margin_amount,
        margin_percentage
      );

      // Update batch stock
      db.prepare(`
        UPDATE batches
        SET quantity_in_stock = quantity_in_stock - ?,
            quantity_sold = quantity_sold + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(item.quantity, item.quantity, item.batch_id);
    }

    return invoiceId;
  });

  try {
    const invoiceId = transaction(req.body);

    // Fetch complete invoice
    const invoice = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `).get(invoiceId);

    const items = db.prepare(`
      SELECT
        sii.*,
        m.name as medicine_name,
        m.manufacturer,
        b.batch_number,
        b.expiry_date
      FROM sales_invoice_items sii
      JOIN medicines m ON sii.medicine_id = m.id
      JOIN batches b ON sii.batch_id = b.id
      WHERE sii.sales_invoice_id = ?
    `).all(invoiceId);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice,
        items
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get daily sales summary
router.get('/reports/daily', (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_invoices,
        SUM(net_amount) as total_sales,
        SUM(CASE WHEN payment_mode = 'CASH' THEN net_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN payment_mode = 'CARD' THEN net_amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN payment_mode = 'UPI' THEN net_amount ELSE 0 END) as upi_sales,
        SUM(CASE WHEN payment_mode = 'CREDIT' THEN net_amount ELSE 0 END) as credit_sales
      FROM sales_invoices
      WHERE DATE(invoice_date) = ?
    `).get(targetDate);

    const topItems = db.prepare(`
      SELECT
        m.name as medicine_name,
        SUM(sii.quantity) as total_quantity,
        SUM(sii.total_amount) as total_amount
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      JOIN medicines m ON sii.medicine_id = m.id
      WHERE DATE(si.invoice_date) = ?
      GROUP BY sii.medicine_id
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all(targetDate);

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary,
        top_items: topItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
