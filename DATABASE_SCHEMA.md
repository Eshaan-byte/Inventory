# Database Schema Design

## Core Tables

### 1. Company Profile
```sql
companies
- id (PRIMARY KEY)
- name
- address
- city
- state
- pincode
- phone
- email
- gstin
- drug_license_no
- financial_year_start
- created_at
- updated_at
```

### 2. Users
```sql
users
- id (PRIMARY KEY)
- username
- password_hash
- role (ADMIN, OPERATOR)
- is_active
- created_at
- last_login
```

### 3. Medicine Master
```sql
medicines
- id (PRIMARY KEY)
- name
- salt_composition
- manufacturer
- schedule (H, H1, X, OTC)
- hsn_code
- gst_percentage
- rack_location
- unit (STRIP, BOX, BOTTLE, etc.)
- is_active
- created_at
- updated_at
```

### 4. Batches & Stock
```sql
batches
- id (PRIMARY KEY)
- medicine_id (FOREIGN KEY -> medicines.id)
- batch_number
- expiry_date
- purchase_rate
- mrp
- ptr (Price to Retailer)
- quantity_in_stock
- quantity_sold
- supplier_id (FOREIGN KEY -> suppliers.id)
- purchase_invoice_id (FOREIGN KEY -> purchase_invoices.id)
- created_at
- updated_at
```

### 5. Suppliers
```sql
suppliers
- id (PRIMARY KEY)
- name
- address
- city
- state
- gstin
- phone
- email
- opening_balance
- balance_type (DR/CR)
- created_at
- updated_at
```

### 6. Customers
```sql
customers
- id (PRIMARY KEY)
- name
- phone
- address
- city
- state
- gstin
- credit_limit
- opening_balance
- balance_type (DR/CR)
- created_at
- updated_at
```

### 7. Purchase Invoices
```sql
purchase_invoices
- id (PRIMARY KEY)
- invoice_no
- invoice_date
- supplier_id (FOREIGN KEY -> suppliers.id)
- total_amount
- cgst_amount
- sgst_amount
- igst_amount
- round_off
- net_amount
- created_by (FOREIGN KEY -> users.id)
- created_at
```

### 8. Purchase Invoice Items
```sql
purchase_invoice_items
- id (PRIMARY KEY)
- purchase_invoice_id (FOREIGN KEY -> purchase_invoices.id)
- medicine_id (FOREIGN KEY -> medicines.id)
- batch_id (FOREIGN KEY -> batches.id)
- quantity
- free_quantity
- purchase_rate
- mrp
- ptr
- discount_percentage
- gst_percentage
- cgst_amount
- sgst_amount
- igst_amount
- total_amount
```

### 9. Sales Invoices
```sql
sales_invoices
- id (PRIMARY KEY)
- invoice_no
- invoice_date
- customer_id (FOREIGN KEY -> customers.id)
- payment_mode (CASH, CARD, UPI, CREDIT)
- total_amount
- discount_amount
- cgst_amount
- sgst_amount
- igst_amount
- round_off
- net_amount
- created_by (FOREIGN KEY -> users.id)
- created_at
```

### 10. Sales Invoice Items
```sql
sales_invoice_items
- id (PRIMARY KEY)
- sales_invoice_id (FOREIGN KEY -> sales_invoices.id)
- medicine_id (FOREIGN KEY -> medicines.id)
- batch_id (FOREIGN KEY -> batches.id)
- quantity
- sale_rate
- mrp
- discount_percentage
- gst_percentage
- cgst_amount
- sgst_amount
- igst_amount
- total_amount
- margin_amount
- margin_percentage
```

### 11. Ledgers (Simplified Accounting)
```sql
ledgers
- id (PRIMARY KEY)
- name
- ledger_type (CASH, BANK, PARTY, PURCHASE, SALES, EXPENSE)
- parent_ledger_id (for grouping)
- opening_balance
- balance_type (DR/CR)
- created_at
```

### 12. Transactions
```sql
transactions
- id (PRIMARY KEY)
- transaction_date
- ledger_id (FOREIGN KEY -> ledgers.id)
- debit_amount
- credit_amount
- narration
- reference_type (PURCHASE, SALES, PAYMENT, RECEIPT)
- reference_id
- created_by (FOREIGN KEY -> users.id)
- created_at
```

### 13. Settings
```sql
settings
- id (PRIMARY KEY)
- key
- value
- description
- updated_at
```

## Indexes for Performance

```sql
CREATE INDEX idx_batches_medicine ON batches(medicine_id);
CREATE INDEX idx_batches_expiry ON batches(expiry_date);
CREATE INDEX idx_sales_invoice_date ON sales_invoices(invoice_date);
CREATE INDEX idx_purchase_invoice_date ON purchase_invoices(invoice_date);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_salt ON medicines(salt_composition);
```

## Views for Reports

### Stock Summary View
```sql
CREATE VIEW v_stock_summary AS
SELECT
  m.id,
  m.name,
  m.salt_composition,
  m.manufacturer,
  SUM(b.quantity_in_stock) as total_quantity,
  MIN(b.expiry_date) as nearest_expiry,
  AVG(b.mrp) as avg_mrp
FROM medicines m
LEFT JOIN batches b ON m.id = b.medicine_id
WHERE b.quantity_in_stock > 0
GROUP BY m.id;
```

### Expiry Alert View
```sql
CREATE VIEW v_expiry_alerts AS
SELECT
  m.name,
  m.manufacturer,
  b.batch_number,
  b.expiry_date,
  b.quantity_in_stock,
  b.mrp,
  (julianday(b.expiry_date) - julianday('now')) as days_to_expiry
FROM medicines m
JOIN batches b ON m.id = b.medicine_id
WHERE b.quantity_in_stock > 0
  AND b.expiry_date > date('now')
  AND b.expiry_date <= date('now', '+90 days')
ORDER BY b.expiry_date;
```
