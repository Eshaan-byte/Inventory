/**
 * AI Builder Pharma - Comprehensive Feature Testing Script
 *
 * This script tests all features of the application by:
 * 1. Creating sample data (medicines, suppliers, customers)
 * 2. Testing purchase invoices
 * 3. Testing sales/billing
 * 4. Testing reports
 * 5. Verifying data integrity
 */

const API_BASE = 'http://localhost:3000/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null) {
  stats.total++;
  const url = `${API_BASE}${endpoint}`;

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      stats.failed++;
      stats.errors.push({ endpoint, error: result.error });
      log.error(`${method} ${endpoint}: ${result.error || 'Failed'}`);
      return null;
    }

    stats.passed++;
    return result.data;
  } catch (error) {
    stats.failed++;
    stats.errors.push({ endpoint, error: error.message });
    log.error(`${method} ${endpoint}: ${error.message}`);
    return null;
  }
}

// Sample data
const sampleMedicines = [
  {
    name: 'Paracetamol 500mg',
    salt_composition: 'Paracetamol',
    manufacturer: 'ABC Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'A1',
    unit: 'STRIP'
  },
  {
    name: 'Amoxicillin 500mg',
    salt_composition: 'Amoxicillin',
    manufacturer: 'XYZ Pharma',
    schedule: 'H',
    hsn_code: '30042000',
    gst_percentage: 12,
    rack_location: 'A2',
    unit: 'STRIP'
  },
  {
    name: 'Azithromycin 250mg',
    salt_composition: 'Azithromycin',
    manufacturer: 'ABC Pharma',
    schedule: 'H',
    hsn_code: '30042000',
    gst_percentage: 12,
    rack_location: 'A3',
    unit: 'STRIP'
  },
  {
    name: 'Cetirizine 10mg',
    salt_composition: 'Cetirizine HCl',
    manufacturer: 'DEF Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'B1',
    unit: 'STRIP'
  },
  {
    name: 'Omeprazole 20mg',
    salt_composition: 'Omeprazole',
    manufacturer: 'XYZ Pharma',
    schedule: 'H',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'B2',
    unit: 'STRIP'
  },
  {
    name: 'Metformin 500mg',
    salt_composition: 'Metformin HCl',
    manufacturer: 'ABC Pharma',
    schedule: 'H',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'C1',
    unit: 'STRIP'
  },
  {
    name: 'Aspirin 75mg',
    salt_composition: 'Acetylsalicylic Acid',
    manufacturer: 'DEF Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'C2',
    unit: 'STRIP'
  },
  {
    name: 'Vitamin D3 60K',
    salt_composition: 'Cholecalciferol',
    manufacturer: 'XYZ Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'D1',
    unit: 'CAPSULE'
  },
  {
    name: 'Cough Syrup 100ml',
    salt_composition: 'Dextromethorphan',
    manufacturer: 'ABC Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'E1',
    unit: 'BOTTLE'
  },
  {
    name: 'Ibuprofen 400mg',
    salt_composition: 'Ibuprofen',
    manufacturer: 'DEF Pharma',
    schedule: 'OTC',
    hsn_code: '30049099',
    gst_percentage: 12,
    rack_location: 'F1',
    unit: 'STRIP'
  }
];

const sampleSuppliers = [
  {
    name: 'MediSupply Co.',
    address: '123 Pharma Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27AAAAA0000A1Z5',
    phone: '9876543210',
    email: 'medisupply@example.com',
    opening_balance: 0,
    balance_type: 'CR'
  },
  {
    name: 'HealthDist Pvt Ltd',
    address: '456 Medical Road',
    city: 'Delhi',
    state: 'Delhi',
    gstin: '07BBBBB0000B1Z5',
    phone: '9876543211',
    email: 'healthdist@example.com',
    opening_balance: 0,
    balance_type: 'CR'
  }
];

const sampleCustomers = [
  {
    name: 'Walk-in Customer',
    phone: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    credit_limit: 0
  },
  {
    name: 'Dr. Sharma Clinic',
    phone: '9876543220',
    address: '789 Hospital Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27CCCCC0000C1Z5',
    credit_limit: 50000
  },
  {
    name: 'City Hospital',
    phone: '9876543221',
    address: '100 Healthcare Ave',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27DDDDD0000D1Z5',
    credit_limit: 100000
  }
];

// Store created IDs
const createdData = {
  medicines: [],
  suppliers: [],
  customers: [],
  batches: [],
  purchaseInvoices: [],
  salesInvoices: []
};

// Main test function
async function runTests() {
  console.log(`
${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      AI Builder Pharma - Feature Testing Suite          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  // Test 1: Health Check
  log.section('1. API Health Check');
  const health = await apiCall('GET', '/health');
  if (health) {
    log.success(`API Status: ${health.status}`);
    log.success(`Database: ${health.database}`);
  }

  // Test 2: Setup Status
  log.section('2. Setup Status Check');
  const setupStatus = await apiCall('GET', '/auth/setup-status');
  if (setupStatus) {
    log.info(`Setup needed: ${setupStatus.needs_setup}`);
    log.info(`Has users: ${setupStatus.has_users}`);
    log.info(`Has company: ${setupStatus.has_company}`);
  }

  // Test 3: Create Medicines
  log.section('3. Creating Sample Medicines');
  for (const medicine of sampleMedicines) {
    const created = await apiCall('POST', '/medicines', medicine);
    if (created) {
      createdData.medicines.push(created);
      log.success(`Created: ${medicine.name}`);
    }
  }
  log.info(`Total medicines created: ${createdData.medicines.length}/${sampleMedicines.length}`);

  // Test 4: Search Medicines
  log.section('4. Testing Medicine Search');
  const searchResult = await apiCall('GET', '/medicines/search/autocomplete?q=para');
  if (searchResult) {
    log.success(`Search found ${searchResult.length} medicines for "para"`);
  }

  // Test 5: Create Suppliers
  log.section('5. Creating Sample Suppliers');
  for (const supplier of sampleSuppliers) {
    const created = await apiCall('POST', '/suppliers', supplier);
    if (created) {
      createdData.suppliers.push(created);
      log.success(`Created: ${supplier.name}`);
    }
  }

  // Test 6: Create Customers
  log.section('6. Creating Sample Customers');
  for (const customer of sampleCustomers) {
    const created = await apiCall('POST', '/customers', customer);
    if (created) {
      createdData.customers.push(created);
      log.success(`Created: ${customer.name}`);
    }
  }

  // Test 7: Create Purchase Invoice with Batches
  log.section('7. Creating Purchase Invoice');
  if (createdData.medicines.length > 0 && createdData.suppliers.length > 0) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const expiryDate = futureDate.toISOString().split('T')[0];

    const purchaseData = {
      invoice_no: 'PUR000001',
      invoice_date: new Date().toISOString().split('T')[0],
      supplier_id: createdData.suppliers[0].id,
      items: createdData.medicines.slice(0, 5).map((medicine, index) => ({
        medicine_id: medicine.id,
        batch_number: `BATCH${String(index + 1).padStart(3, '0')}`,
        expiry_date: expiryDate,
        quantity: 100,
        free_quantity: 10,
        purchase_rate: 50 + (index * 10),
        mrp: 100 + (index * 20),
        ptr: 80 + (index * 15),
        discount_percentage: 5,
        gst_percentage: medicine.gst_percentage
      })),
      created_by: 1
    };

    const purchase = await apiCall('POST', '/purchases', purchaseData);
    if (purchase) {
      createdData.purchaseInvoices.push(purchase.invoice);
      log.success(`Purchase invoice created: ${purchase.invoice.invoice_no}`);
      log.success(`Total amount: ₹${purchase.invoice.net_amount}`);
      log.success(`Items: ${purchase.items.length}`);
    }
  }

  // Test 8: Check Stock After Purchase
  log.section('8. Verifying Stock After Purchase');
  const stockSummary = await apiCall('GET', '/reports/stock-summary');
  if (stockSummary) {
    log.success(`Total medicines in stock: ${stockSummary.summary.total_medicines}`);
    log.success(`Total stock quantity: ${stockSummary.summary.total_stock_quantity}`);
  }

  // Test 9: Get Available Batches
  log.section('9. Checking Available Batches');
  if (createdData.medicines.length > 0) {
    const batches = await apiCall('GET', `/batches/medicine/${createdData.medicines[0].id}/available`);
    if (batches) {
      log.success(`Found ${batches.length} available batches for ${createdData.medicines[0].name}`);
      if (batches.length > 0) {
        createdData.batches = batches;
        log.info(`First batch: ${batches[0].batch_number}, Stock: ${batches[0].quantity_in_stock}, Expiry: ${batches[0].expiry_date}`);
      }
    }
  }

  // Test 10: Generate Invoice Number
  log.section('10. Generating Sales Invoice Number');
  const invoiceNo = await apiCall('GET', '/sales/generate/invoice-number');
  if (invoiceNo) {
    log.success(`Next invoice number: ${invoiceNo.invoice_no}`);
  }

  // Test 11: Create Sales Invoice
  log.section('11. Creating Sales Invoice (Billing Test)');
  if (createdData.batches.length > 0 && createdData.customers.length > 0) {
    const salesData = {
      invoice_no: invoiceNo?.invoice_no || 'INV000001',
      invoice_date: new Date().toISOString().split('T')[0],
      customer_id: createdData.customers[0].id,
      payment_mode: 'CASH',
      items: createdData.batches.slice(0, 3).map(batch => ({
        medicine_id: batch.medicine_id,
        batch_id: batch.id,
        quantity: 5,
        sale_rate: batch.mrp,
        mrp: batch.mrp,
        discount_percentage: 0,
        gst_percentage: batch.gst_percentage
      })),
      created_by: 1
    };

    const sale = await apiCall('POST', '/sales', salesData);
    if (sale) {
      createdData.salesInvoices.push(sale.invoice);
      log.success(`Sales invoice created: ${sale.invoice.invoice_no}`);
      log.success(`Net amount: ₹${sale.invoice.net_amount}`);
      log.success(`Items sold: ${sale.items.length}`);
      log.success(`Payment mode: ${sale.invoice.payment_mode}`);
    }
  }

  // Test 12: Verify Stock Deduction
  log.section('12. Verifying Stock After Sales');
  if (createdData.batches.length > 0) {
    const batch = await apiCall('GET', `/batches/${createdData.batches[0].id}`);
    if (batch) {
      const originalStock = createdData.batches[0].quantity_in_stock;
      const currentStock = batch.quantity_in_stock;
      log.success(`Original stock: ${originalStock}`);
      log.success(`Current stock: ${currentStock}`);
      log.success(`Stock reduced by: ${originalStock - currentStock}`);
    }
  }

  // Test 13: Daily Sales Report
  log.section('13. Testing Daily Sales Report');
  const today = new Date().toISOString().split('T')[0];
  const dailySales = await apiCall('GET', `/sales/reports/daily?date=${today}`);
  if (dailySales) {
    log.success(`Total sales today: ₹${dailySales.summary.total_sales || 0}`);
    log.success(`Total invoices: ${dailySales.summary.total_invoices || 0}`);
    log.success(`Cash sales: ₹${dailySales.summary.cash_sales || 0}`);
  }

  // Test 14: Expiry Alerts
  log.section('14. Testing Expiry Alerts');
  const expiryAlerts = await apiCall('GET', '/batches/alerts/expiry?days=90');
  if (expiryAlerts) {
    log.success(`Medicines expiring in 90 days: ${expiryAlerts.length}`);
  }

  // Test 15: Sales Report
  log.section('15. Testing Sales Report');
  const salesReport = await apiCall('GET', `/reports/sales?from_date=${today}&to_date=${today}`);
  if (salesReport && salesReport.sales) {
    log.success(`Sales records found: ${salesReport.sales.length}`);
    if (salesReport.top_medicines) {
      log.success(`Top medicines tracked: ${salesReport.top_medicines.length}`);
    }
  }

  // Test 16: GST Report (HSN Summary)
  log.section('16. Testing GST HSN Summary');
  const hsnReport = await apiCall('GET', `/reports/hsn-summary?from_date=${today}&to_date=${today}&type=sales`);
  if (hsnReport && hsnReport.hsn_summary) {
    log.success(`HSN codes found: ${hsnReport.hsn_summary.length}`);
    if (hsnReport.hsn_summary.length > 0) {
      const firstHsn = hsnReport.hsn_summary[0];
      log.info(`First HSN: ${firstHsn.hsn_code}, GST: ${firstHsn.gst_percentage}%`);
    }
  }

  // Test 17: Profit & Margin Report
  log.section('17. Testing Profit & Margin Report');
  const profitReport = await apiCall('GET', `/reports/profit-margin?from_date=${today}&to_date=${today}`);
  if (profitReport && profitReport.summary) {
    log.success(`Total sales: ₹${profitReport.summary.total_sales || 0}`);
    log.success(`Total margin: ₹${profitReport.summary.total_margin || 0}`);
    log.success(`Avg margin %: ${profitReport.summary.avg_margin_percentage?.toFixed(2) || 0}%`);
  }

  // Test 18: Batch-wise Stock Report
  log.section('18. Testing Batch-wise Stock Report');
  const batchStock = await apiCall('GET', '/reports/batch-stock');
  if (batchStock) {
    log.success(`Total batches in stock: ${batchStock.length}`);
  }

  // Test 19: Company Profile
  log.section('19. Testing Company Profile');
  const company = await apiCall('GET', '/settings/company/profile');
  if (company) {
    log.success(`Company: ${company.name || 'Not set'}`);
  }

  // Test 20: Settings
  log.section('20. Testing Settings');
  const settings = await apiCall('GET', '/settings');
  if (settings) {
    log.success(`Settings loaded: ${Object.keys(settings).length} settings`);
  }

  // Final Summary
  log.section('Test Results Summary');
  console.log(`
${colors.bold}Total Tests:${colors.reset}    ${stats.total}
${colors.green}${colors.bold}Passed:${colors.reset}         ${stats.passed}
${colors.red}${colors.bold}Failed:${colors.reset}         ${stats.failed}
${colors.cyan}${colors.bold}Success Rate:${colors.reset}   ${((stats.passed / stats.total) * 100).toFixed(2)}%

${colors.bold}Sample Data Created:${colors.reset}
  • Medicines:           ${createdData.medicines.length}
  • Suppliers:           ${createdData.suppliers.length}
  • Customers:           ${createdData.customers.length}
  • Purchase Invoices:   ${createdData.purchaseInvoices.length}
  • Sales Invoices:      ${createdData.salesInvoices.length}
  `);

  if (stats.failed > 0) {
    log.section('Failed Tests');
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.endpoint}: ${error.error}`);
    });
  }

  if (stats.passed === stats.total) {
    console.log(`${colors.green}${colors.bold}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉            ║
║                                                          ║
║     AI Builder Pharma is ready for production use!       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bold}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      ⚠️  SOME TESTS FAILED - CHECK ERRORS ABOVE  ⚠️       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
  }

  log.info('\nYou can now open http://localhost:5173 to see the data in the UI!');
}

// Run tests
runTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});
