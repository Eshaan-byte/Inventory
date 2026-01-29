const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Stock summary report
router.get('/stock-summary', (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM v_stock_summary WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR salt_composition LIKE ? OR manufacturer LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const stock = db.prepare(query).all(...params);

    const summary = db.prepare(`
      SELECT
        COUNT(DISTINCT id) as total_medicines,
        SUM(total_quantity) as total_stock_quantity
      FROM v_stock_summary
    `).get();

    res.json({
      success: true,
      data: {
        summary,
        items: stock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch-wise stock report
router.get('/batch-stock', (req, res) => {
  try {
    const { medicine_id } = req.query;

    let query = `
      SELECT
        b.*,
        m.name as medicine_name,
        m.manufacturer,
        s.name as supplier_name,
        CAST((julianday(b.expiry_date) - julianday('now')) AS INTEGER) as days_to_expiry,
        (b.quantity_in_stock * b.purchase_rate) as stock_value
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.quantity_in_stock > 0
    `;
    const params = [];

    if (medicine_id) {
      query += ' AND b.medicine_id = ?';
      params.push(medicine_id);
    }

    query += ' ORDER BY b.expiry_date ASC';

    const batches = db.prepare(query).all(...params);

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Expiry report
router.get('/expiry', (req, res) => {
  try {
    const { days = 90 } = req.query;

    const nearExpiry = db.prepare(`
      SELECT * FROM v_expiry_alerts
      WHERE days_to_expiry <= ?
      ORDER BY days_to_expiry ASC
    `).all(days);

    const expired = db.prepare('SELECT * FROM v_expired_stock').all();

    const summary = {
      near_expiry_count: nearExpiry.length,
      expired_count: expired.length,
      near_expiry_value: nearExpiry.reduce((sum, item) => sum + (item.quantity_in_stock * item.mrp), 0),
      expired_value: expired.reduce((sum, item) => sum + item.loss_value, 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        near_expiry: nearExpiry,
        expired
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sales report
router.get('/sales', (req, res) => {
  try {
    const { from_date, to_date, group_by = 'date' } = req.query;

    let query = `
      SELECT
        DATE(invoice_date) as date,
        COUNT(*) as invoice_count,
        SUM(net_amount) as total_sales,
        SUM(cgst_amount + sgst_amount + igst_amount) as total_tax,
        SUM(discount_amount) as total_discount
      FROM sales_invoices
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ' AND invoice_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND invoice_date <= ?';
      params.push(to_date);
    }

    if (group_by === 'date') {
      query += ' GROUP BY DATE(invoice_date) ORDER BY date DESC';
    } else if (group_by === 'month') {
      query += ' GROUP BY strftime("%Y-%m", invoice_date) ORDER BY date DESC';
    }

    const sales = db.prepare(query).all(...params);

    // Top selling medicines
    const topMedicines = db.prepare(`
      SELECT
        m.name as medicine_name,
        m.manufacturer,
        SUM(sii.quantity) as total_quantity,
        SUM(sii.total_amount) as total_amount,
        SUM(sii.margin_amount) as total_margin
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      JOIN medicines m ON sii.medicine_id = m.id
      WHERE si.invoice_date >= ? AND si.invoice_date <= ?
      GROUP BY sii.medicine_id
      ORDER BY total_quantity DESC
      LIMIT 20
    `).all(from_date || '2000-01-01', to_date || '2099-12-31');

    res.json({
      success: true,
      data: {
        sales,
        top_medicines: topMedicines
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Purchase report
router.get('/purchases', (req, res) => {
  try {
    const { from_date, to_date, group_by = 'date' } = req.query;

    let query = `
      SELECT
        DATE(invoice_date) as date,
        COUNT(*) as invoice_count,
        SUM(net_amount) as total_purchases,
        SUM(cgst_amount + sgst_amount + igst_amount) as total_tax
      FROM purchase_invoices
      WHERE 1=1
    `;
    const params = [];

    if (from_date) {
      query += ' AND invoice_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND invoice_date <= ?';
      params.push(to_date);
    }

    if (group_by === 'date') {
      query += ' GROUP BY DATE(invoice_date) ORDER BY date DESC';
    } else if (group_by === 'month') {
      query += ' GROUP BY strftime("%Y-%m", invoice_date) ORDER BY date DESC';
    }

    const purchases = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profit & Margin report
router.get('/profit-margin', (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let query = `
      SELECT
        m.name as medicine_name,
        m.manufacturer,
        SUM(sii.quantity) as quantity_sold,
        SUM(sii.total_amount) as sales_amount,
        SUM(sii.margin_amount) as margin_amount,
        AVG(sii.margin_percentage) as avg_margin_percentage
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      JOIN medicines m ON sii.medicine_id = m.id
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

    query += ' GROUP BY sii.medicine_id ORDER BY margin_amount DESC';

    const items = db.prepare(query).all(...params);

    const summary = {
      total_sales: items.reduce((sum, item) => sum + item.sales_amount, 0),
      total_margin: items.reduce((sum, item) => sum + item.margin_amount, 0),
      avg_margin_percentage: items.length > 0
        ? items.reduce((sum, item) => sum + item.avg_margin_percentage, 0) / items.length
        : 0
    };

    res.json({
      success: true,
      data: {
        summary,
        items
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GST Reports - GSTR1
router.get('/gstr1', (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        success: false,
        error: 'from_date and to_date are required'
      });
    }

    // B2B Sales (with GSTIN)
    const b2b = db.prepare(`
      SELECT
        c.gstin,
        c.name as customer_name,
        si.invoice_no,
        si.invoice_date,
        si.total_amount as taxable_value,
        si.cgst_amount,
        si.sgst_amount,
        si.igst_amount,
        si.net_amount
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      WHERE si.invoice_date >= ?
        AND si.invoice_date <= ?
        AND c.gstin IS NOT NULL
        AND c.gstin != ''
      ORDER BY si.invoice_date
    `).all(from_date, to_date);

    // B2C Large (>2.5 lakhs)
    const b2cl = db.prepare(`
      SELECT
        si.invoice_no,
        si.invoice_date,
        si.total_amount as taxable_value,
        si.net_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.invoice_date >= ?
        AND si.invoice_date <= ?
        AND (c.gstin IS NULL OR c.gstin = '')
        AND si.net_amount > 250000
      ORDER BY si.invoice_date
    `).all(from_date, to_date);

    // B2C Small
    const b2cs = db.prepare(`
      SELECT
        DATE(si.invoice_date) as date,
        SUM(si.total_amount) as taxable_value,
        SUM(si.cgst_amount) as cgst_amount,
        SUM(si.sgst_amount) as sgst_amount,
        SUM(si.net_amount) as total_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.invoice_date >= ?
        AND si.invoice_date <= ?
        AND (c.gstin IS NULL OR c.gstin = '')
        AND si.net_amount <= 250000
      GROUP BY DATE(si.invoice_date)
      ORDER BY date
    `).all(from_date, to_date);

    res.json({
      success: true,
      data: {
        b2b,
        b2cl,
        b2cs,
        period: { from_date, to_date }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// HSN Summary for GST
router.get('/hsn-summary', (req, res) => {
  try {
    const { from_date, to_date, type = 'sales' } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        success: false,
        error: 'from_date and to_date are required'
      });
    }

    let query;
    if (type === 'sales') {
      query = `
        SELECT
          m.hsn_code,
          m.gst_percentage,
          SUM(sii.quantity) as total_quantity,
          SUM(sii.total_amount - (sii.cgst_amount + sii.sgst_amount + sii.igst_amount)) as taxable_value,
          SUM(sii.cgst_amount) as cgst_amount,
          SUM(sii.sgst_amount) as sgst_amount,
          SUM(sii.igst_amount) as igst_amount,
          SUM(sii.total_amount) as total_amount
        FROM sales_invoice_items sii
        JOIN sales_invoices si ON sii.sales_invoice_id = si.id
        JOIN medicines m ON sii.medicine_id = m.id
        WHERE si.invoice_date >= ? AND si.invoice_date <= ?
        GROUP BY m.hsn_code, m.gst_percentage
        ORDER BY m.hsn_code
      `;
    } else {
      query = `
        SELECT
          m.hsn_code,
          m.gst_percentage,
          SUM(pii.quantity) as total_quantity,
          SUM(pii.total_amount - (pii.cgst_amount + pii.sgst_amount + pii.igst_amount)) as taxable_value,
          SUM(pii.cgst_amount) as cgst_amount,
          SUM(pii.sgst_amount) as sgst_amount,
          SUM(pii.igst_amount) as igst_amount,
          SUM(pii.total_amount) as total_amount
        FROM purchase_invoice_items pii
        JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
        JOIN medicines m ON pii.medicine_id = m.id
        WHERE pi.invoice_date >= ? AND pi.invoice_date <= ?
        GROUP BY m.hsn_code, m.gst_percentage
        ORDER BY m.hsn_code
      `;
    }

    const hsnData = db.prepare(query).all(from_date, to_date);

    res.json({
      success: true,
      data: {
        hsn_summary: hsnData,
        period: { from_date, to_date },
        type
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
