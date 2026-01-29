const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Get all settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings ORDER BY key').all();

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ success: true, data: settingsObj, raw: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get setting by key
router.get('/:key', (req, res) => {
  try {
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);

    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update or create setting
router.post('/', (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key) {
      return res.status(400).json({ success: false, error: 'Key is required' });
    }

    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (existing) {
      db.prepare(`
        UPDATE settings
        SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(value, description || existing.description, key);
    } else {
      db.prepare(`
        INSERT INTO settings (key, value, description)
        VALUES (?, ?, ?)
      `).run(key, value, description);
    }

    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    res.json({
      success: true,
      message: 'Setting saved successfully',
      data: setting
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update settings
router.put('/bulk', (req, res) => {
  const transaction = db.transaction((settings) => {
    for (const [key, value] of Object.entries(settings)) {
      const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

      if (existing) {
        db.prepare(`
          UPDATE settings
          SET value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE key = ?
        `).run(value, key);
      } else {
        db.prepare(`
          INSERT INTO settings (key, value)
          VALUES (?, ?)
        `).run(key, value);
      }
    }
  });

  try {
    transaction(req.body);

    const allSettings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    allSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsObj
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company profile
router.get('/company/profile', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies ORDER BY id DESC LIMIT 1').get();

    if (!company) {
      return res.json({
        success: true,
        data: null,
        message: 'No company profile found'
      });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update company profile
router.post('/company/profile', (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      gstin,
      drug_license_no,
      financial_year_start
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    const existing = db.prepare('SELECT * FROM companies ORDER BY id DESC LIMIT 1').get();

    if (existing) {
      db.prepare(`
        UPDATE companies SET
          name = ?,
          address = ?,
          city = ?,
          state = ?,
          pincode = ?,
          phone = ?,
          email = ?,
          gstin = ?,
          drug_license_no = ?,
          financial_year_start = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name, address, city, state, pincode, phone, email,
        gstin, drug_license_no, financial_year_start, existing.id
      );

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(existing.id);

      res.json({
        success: true,
        message: 'Company profile updated successfully',
        data: company
      });
    } else {
      const result = db.prepare(`
        INSERT INTO companies (
          name, address, city, state, pincode, phone, email,
          gstin, drug_license_no, financial_year_start
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, address, city, state, pincode, phone, email,
        gstin, drug_license_no, financial_year_start
      );

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);

      res.status(201).json({
        success: true,
        message: 'Company profile created successfully',
        data: company
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
