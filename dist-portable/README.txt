============================================
  AI Builder Pharma - Inventory Software
  Portable Web Version
============================================

SYSTEM REQUIREMENTS:
-------------------
- Windows 10/11 (64-bit)
- Node.js 18+ (https://nodejs.org)
- 500 MB free disk space
- Modern web browser (Chrome, Edge, Firefox)

INSTALLATION:
------------
1. Extract this folder to any location (e.g., C:\AIBuilderPharma)
2. Double-click: INSTALL.bat
3. Wait for installation to complete (2-5 minutes)

RUNNING THE APPLICATION:
-----------------------
1. Double-click: START.bat
2. Your browser will open at: http://localhost:3000
3. First time users: Click "Setup Company"

DEFAULT LOGIN:
-------------
Username: admin
Password: admin123

(Change password after first login!)

KEYBOARD SHORTCUTS:
------------------
F2  - New Bill
F3  - New Medicine
F4  - New Supplier
F5  - New Customer
F6  - New Purchase
F7  - Reports
F8  - Settings
F9  - Dashboard

FEATURES:
--------
✓ Medicine Master Management
✓ Batch-wise Stock Tracking
✓ Fast Billing (F2)
✓ Purchase Management
✓ Supplier & Customer Management
✓ Expiry Alerts (30/60/90 days)
✓ Stock Reports
✓ Sales Reports
✓ GST Invoicing (CGST/SGST)
✓ Drug Schedule Management (H, H1, X, OTC)
✓ 100% Offline - No Internet Required

DATA LOCATION:
-------------
All data stored in: backend/database/pharma.db

BACKUP YOUR DATA:
----------------
Important! Regularly backup: backend/database/pharma.db
Copy this file to a safe location (USB drive, cloud storage)

STOPPING THE APPLICATION:
------------------------
Press Ctrl+C in the command window, or close the window

TROUBLESHOOTING:
---------------
1. Port 3000 already in use:
   - Close other applications using port 3000
   - Or edit backend/server.js to change the port

2. Application won't start:
   - Run INSTALL.bat again
   - Check Node.js is installed: node --version
   - Check for error messages in the command window

3. Database errors:
   - Delete backend/database/pharma.db
   - Restart START.bat (creates fresh database)

4. Browser doesn't open automatically:
   - Manually open: http://localhost:3000

SUPPORT:
-------
GitHub: https://github.com/Eshaan-byte/Inventory
Issues: https://github.com/Eshaan-byte/Inventory/issues

VERSION: 1.0.0
LICENSE: MIT
