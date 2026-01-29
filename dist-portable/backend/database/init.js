const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Determine data directory
const isDev = process.env.NODE_ENV !== 'production';
const dataDir = isDev
  ? path.join(__dirname, '../../data')
  : path.join(process.env.APPDATA || process.env.HOME, 'AIBuilderPharma', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pharma.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
function initializeDatabase() {
  // Create tables
  db.exec(`
    -- Company Profile
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      drug_license_no TEXT,
      financial_year_start TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'OPERATOR')) DEFAULT 'OPERATOR',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    -- Medicine Master
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      salt_composition TEXT,
      manufacturer TEXT,
      schedule TEXT CHECK(schedule IN ('H', 'H1', 'X', 'OTC', 'NONE')) DEFAULT 'NONE',
      hsn_code TEXT,
      gst_percentage REAL DEFAULT 12.0,
      rack_location TEXT,
      unit TEXT DEFAULT 'STRIP',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      gstin TEXT,
      phone TEXT,
      email TEXT,
      opening_balance REAL DEFAULT 0,
      balance_type TEXT CHECK(balance_type IN ('DR', 'CR')) DEFAULT 'CR',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      gstin TEXT,
      credit_limit REAL DEFAULT 0,
      opening_balance REAL DEFAULT 0,
      balance_type TEXT CHECK(balance_type IN ('DR', 'CR')) DEFAULT 'DR',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Batches & Stock
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      expiry_date DATE NOT NULL,
      purchase_rate REAL NOT NULL,
      mrp REAL NOT NULL,
      ptr REAL,
      quantity_in_stock INTEGER DEFAULT 0,
      quantity_sold INTEGER DEFAULT 0,
      supplier_id INTEGER,
      purchase_invoice_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      UNIQUE(medicine_id, batch_number)
    );

    -- Purchase Invoices
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      invoice_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Purchase Invoice Items
    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_invoice_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      free_quantity INTEGER DEFAULT 0,
      purchase_rate REAL NOT NULL,
      mrp REAL NOT NULL,
      ptr REAL,
      discount_percentage REAL DEFAULT 0,
      gst_percentage REAL DEFAULT 12.0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    -- Sales Invoices
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      invoice_date DATE NOT NULL,
      customer_id INTEGER,
      payment_mode TEXT CHECK(payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT')) DEFAULT 'CASH',
      total_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Sales Invoice Items
    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_invoice_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      sale_rate REAL NOT NULL,
      mrp REAL NOT NULL,
      discount_percentage REAL DEFAULT 0,
      gst_percentage REAL DEFAULT 12.0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      margin_amount REAL DEFAULT 0,
      margin_percentage REAL DEFAULT 0,
      FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    -- Ledgers
    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ledger_type TEXT CHECK(ledger_type IN ('CASH', 'BANK', 'PARTY', 'PURCHASE', 'SALES', 'EXPENSE')),
      parent_ledger_id INTEGER,
      opening_balance REAL DEFAULT 0,
      balance_type TEXT CHECK(balance_type IN ('DR', 'CR')) DEFAULT 'DR',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_ledger_id) REFERENCES ledgers(id)
    );

    -- Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_date DATE NOT NULL,
      ledger_id INTEGER NOT NULL,
      debit_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      narration TEXT,
      reference_type TEXT,
      reference_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ledger_id) REFERENCES ledgers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_batches_medicine ON batches(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice_date ON sales_invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_purchase_invoice_date ON purchase_invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
    CREATE INDEX IF NOT EXISTS idx_medicines_salt ON medicines(salt_composition);
  `);

  // Create views
  db.exec(`
    -- Stock Summary View
    DROP VIEW IF EXISTS v_stock_summary;
    CREATE VIEW v_stock_summary AS
    SELECT
      m.id,
      m.name,
      m.salt_composition,
      m.manufacturer,
      m.hsn_code,
      m.gst_percentage,
      SUM(b.quantity_in_stock) as total_quantity,
      MIN(b.expiry_date) as nearest_expiry,
      AVG(b.mrp) as avg_mrp,
      m.rack_location
    FROM medicines m
    LEFT JOIN batches b ON m.id = b.medicine_id AND b.quantity_in_stock > 0
    WHERE m.is_active = 1
    GROUP BY m.id;

    -- Expiry Alert View
    DROP VIEW IF EXISTS v_expiry_alerts;
    CREATE VIEW v_expiry_alerts AS
    SELECT
      m.name as medicine_name,
      m.manufacturer,
      b.batch_number,
      b.expiry_date,
      b.quantity_in_stock,
      b.mrp,
      CAST((julianday(b.expiry_date) - julianday('now')) AS INTEGER) as days_to_expiry
    FROM medicines m
    JOIN batches b ON m.id = b.medicine_id
    WHERE b.quantity_in_stock > 0
      AND b.expiry_date > date('now')
      AND b.expiry_date <= date('now', '+90 days')
    ORDER BY b.expiry_date;

    -- Expired Stock View
    DROP VIEW IF EXISTS v_expired_stock;
    CREATE VIEW v_expired_stock AS
    SELECT
      m.name as medicine_name,
      m.manufacturer,
      b.batch_number,
      b.expiry_date,
      b.quantity_in_stock,
      b.mrp,
      b.purchase_rate,
      (b.quantity_in_stock * b.purchase_rate) as loss_value
    FROM medicines m
    JOIN batches b ON m.id = b.medicine_id
    WHERE b.quantity_in_stock > 0
      AND b.expiry_date <= date('now')
    ORDER BY b.expiry_date DESC;
  `);

  // Insert default settings
  const defaultSettings = [
    { key: 'app_initialized', value: 'true', description: 'Application initialization flag' },
    { key: 'auto_backup', value: 'true', description: 'Enable automatic backup' },
    { key: 'backup_interval', value: '7', description: 'Backup interval in days' },
    { key: 'expiry_alert_days', value: '90', description: 'Days before expiry to show alert' },
    { key: 'default_gst', value: '12', description: 'Default GST percentage' },
    { key: 'state_code', value: '', description: 'State code for GST' },
    { key: 'thermal_printer', value: 'false', description: 'Use thermal printer' },
    { key: 'invoice_prefix', value: 'INV', description: 'Sales invoice prefix' },
    { key: 'purchase_prefix', value: 'PUR', description: 'Purchase invoice prefix' }
  ];

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)'
  );

  defaultSettings.forEach(setting => {
    insertSetting.run(setting.key, setting.value, setting.description);
  });

  console.log('Database initialized successfully at:', dbPath);
}

// Initialize on import
initializeDatabase();

module.exports = { db, dataDir, dbPath };
