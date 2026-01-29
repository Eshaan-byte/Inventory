# Testing Checklist - AI Builder Pharma

## Pre-Installation Testing

### System Requirements
- [ ] Windows 10/11 (64-bit)
- [ ] Node.js v18+ installed
- [ ] 4GB RAM minimum
- [ ] 500MB free disk space
- [ ] Ports 3000 and 5173 available

---

## Installation Testing

### Step 1: Clone/Extract
- [ ] Project files extracted successfully
- [ ] All files present (check PROJECT_SUMMARY.md)
- [ ] No file corruption

### Step 2: Dependencies
```bash
npm install
```
- [ ] All dependencies installed without errors
- [ ] No vulnerability warnings (critical)
- [ ] node_modules folder created

### Step 3: Start Application
```bash
npm run dev
```
- [ ] Backend starts on port 3000
- [ ] Frontend starts on port 5173
- [ ] Electron window opens
- [ ] No console errors

---

## Setup Wizard Testing

### First Run
- [ ] Setup wizard appears automatically
- [ ] Cannot skip setup

### Company Profile
- [ ] Can enter company name
- [ ] Validation works (required field)
- [ ] Can proceed to next step

### Admin User Creation
- [ ] Can enter username
- [ ] Password validation works (min 6 chars)
- [ ] Confirm password validation works
- [ ] Error shown if passwords don't match
- [ ] Setup completes successfully
- [ ] Redirects to login

---

## Authentication Testing

### Login
- [ ] Login page appears after setup
- [ ] Can login with created credentials
- [ ] Error shown for wrong credentials
- [ ] Error shown for inactive users
- [ ] Redirects to dashboard on success

### Session Management
- [ ] User stays logged in on refresh
- [ ] Logout works correctly
- [ ] Redirects to login after logout

---

## Database Testing

### Database Creation
- [ ] Database file created in `data/pharma.db`
- [ ] All tables created (13 tables)
- [ ] All views created (3 views)
- [ ] Default settings inserted
- [ ] No errors in console

### Database Access
- [ ] Can query database
- [ ] Foreign keys enforced
- [ ] Transactions work
- [ ] No database locked errors

---

## Dashboard Testing

### Initial Load
- [ ] Dashboard loads successfully
- [ ] Shows today's date
- [ ] Shows invoice counter
- [ ] Shows quick stats (all zeros initially)

### Quick Actions
- [ ] All quick action buttons work
- [ ] Correct navigation to each module
- [ ] Keyboard shortcuts work (F2-F8)

### Alerts Section
- [ ] Expiry alerts section visible
- [ ] Shows "No alerts" when empty
- [ ] Updates when data added

---

## Medicine Master Testing

### Navigation
- [ ] Navigate to Medicines (F3)
- [ ] Page loads successfully
- [ ] Shows empty table initially

### Add Medicine
- [ ] Click "+ Add Medicine" button
- [ ] Form appears
- [ ] All fields present
- [ ] Required validation works
- [ ] Can add medicine successfully
- [ ] Medicine appears in table
- [ ] Success message shown

### Test Cases
1. Add medicine with all fields
   - [ ] Name: Paracetamol 500mg
   - [ ] Salt: Paracetamol
   - [ ] Manufacturer: ABC Pharma
   - [ ] Schedule: H
   - [ ] HSN: 30049099
   - [ ] GST: 12%
   - [ ] Success

2. Add medicine with minimal fields
   - [ ] Name only
   - [ ] Should work with defaults
   - [ ] Success

3. Validation tests
   - [ ] Empty name rejected
   - [ ] Duplicate detection works
   - [ ] Invalid GST percentage rejected

### Search
- [ ] Search box works
- [ ] Filters by name
- [ ] Filters by salt
- [ ] Filters by manufacturer
- [ ] Real-time filtering

### Edit Medicine
- [ ] Can click edit
- [ ] Form pre-populated
- [ ] Changes save successfully
- [ ] Table updates

### Delete Medicine
- [ ] Can delete medicine (soft delete)
- [ ] Cannot delete if stock exists
- [ ] Confirmation shown
- [ ] Removed from table

---

## Billing Module Testing (CRITICAL)

### Navigation
- [ ] Navigate to Billing (F2)
- [ ] Page loads quickly (< 1 sec)
- [ ] Invoice number generated
- [ ] Form ready for input

### Medicine Search
- [ ] Focus on search (F12)
- [ ] Type 2 characters
- [ ] Autocomplete appears
- [ ] Can select from list
- [ ] Medicine details loaded

### Batch Selection
- [ ] Batch dropdown appears
- [ ] Shows available batches
- [ ] Shows expiry dates
- [ ] Shows stock levels
- [ ] Can select batch
- [ ] Rate auto-fills

### Add Item
- [ ] Enter quantity
- [ ] Can modify rate
- [ ] Can add discount
- [ ] Click "Add to Bill"
- [ ] Item appears in table
- [ ] Calculations correct

### Bill Calculations
Test with: 1 item, Qty: 10, Rate: 100, GST: 12%
- [ ] Subtotal: 1000.00
- [ ] CGST: 60.00
- [ ] SGST: 60.00
- [ ] Total: 1120.00
- [ ] Round off calculated
- [ ] Net payable shown

### Stock Validation
- [ ] Cannot sell more than available stock
- [ ] Error shown for insufficient stock
- [ ] Cannot sell expired medicines
- [ ] Warning for near-expiry

### Save Bill (F9)
- [ ] Press F9 or click Save
- [ ] Bill saves successfully
- [ ] Success message shown
- [ ] Stock updated in database
- [ ] New invoice number generated
- [ ] Form cleared

### Clear Bill (ESC)
- [ ] Press ESC
- [ ] Form clears
- [ ] Items removed
- [ ] Ready for new bill

### Performance
- [ ] Medicine search < 100ms
- [ ] Bill save < 1 sec
- [ ] No lag in UI
- [ ] Smooth operation

---

## Stock Management Testing

### After Purchase
- [ ] Stock increases
- [ ] Batch created
- [ ] Expiry date recorded

### After Sales
- [ ] Stock decreases
- [ ] Batch quantity updated
- [ ] Quantity sold tracked

### Stock Validation
- [ ] Cannot oversell
- [ ] Negative stock prevented
- [ ] Batch selection correct (FIFO)

---

## Reports Testing

### Stock Reports
- [ ] Navigate to Reports (F7)
- [ ] Stock summary loads
- [ ] Shows correct quantities
- [ ] Search works

### Expiry Reports
- [ ] Near-expiry alerts show
- [ ] Correct day calculation
- [ ] Expired stock separate
- [ ] Color coding works

### Sales Reports
- [ ] Daily sales loads
- [ ] Date filtering works
- [ ] Amounts correct
- [ ] Item-wise sales shows

### GST Reports
- [ ] GSTR-1 format correct
- [ ] B2B/B2C separation
- [ ] HSN summary accurate
- [ ] Tax calculations correct

---

## Settings Testing

### Company Profile
- [ ] Can view profile
- [ ] Can edit profile
- [ ] Changes save
- [ ] Appears on bills

### Application Settings
- [ ] Settings page loads
- [ ] Can view all settings
- [ ] Can modify settings
- [ ] Changes persist

---

## Error Handling Testing

### Network Errors
- [ ] Backend stopped - shows error
- [ ] Database locked - shows error
- [ ] Graceful error messages

### Validation Errors
- [ ] Required fields validated
- [ ] Data type validation
- [ ] Range validation
- [ ] Clear error messages

### Database Errors
- [ ] Foreign key violations caught
- [ ] Unique constraint violations caught
- [ ] Transaction rollback works

---

## Performance Testing

### Load Testing
- [ ] 100 medicines - fast
- [ ] 1000 medicines - acceptable
- [ ] 100 bills/day - smooth
- [ ] Large reports - < 3 sec

### Memory Testing
- [ ] Idle: < 200MB RAM
- [ ] Active: < 400MB RAM
- [ ] No memory leaks
- [ ] Stable over time

### Database Testing
- [ ] 10K records - fast
- [ ] 50K records - acceptable
- [ ] Indexes working
- [ ] Query optimization

---

## Keyboard Shortcuts Testing

### Navigation
- [ ] F2 - Billing works
- [ ] F3 - Medicines works
- [ ] F4 - Purchases works
- [ ] F5 - Customers works
- [ ] F6 - Suppliers works
- [ ] F7 - Reports works
- [ ] F8 - Settings works

### Billing Shortcuts
- [ ] F12 - Focus search works
- [ ] F9 - Save bill works
- [ ] ESC - Clear bill works
- [ ] Tab - Navigate fields works

---

## Multi-User Testing

### Admin User
- [ ] Full access to all modules
- [ ] Can create users
- [ ] Can modify settings

### Operator User
- [ ] Can access billing
- [ ] Cannot modify settings
- [ ] Appropriate restrictions

---

## Data Integrity Testing

### Transactions
- [ ] Sales transaction atomic
- [ ] Stock updates correctly
- [ ] Rollback on error works

### Batch Tracking
- [ ] FIFO selection works
- [ ] Expiry dates enforced
- [ ] Cannot modify batch after sale

### GST Calculations
- [ ] CGST + SGST = Total GST
- [ ] Percentages correct
- [ ] Rounding correct

---

## Edge Cases Testing

### Boundary Cases
- [ ] Zero quantity rejected
- [ ] Negative numbers rejected
- [ ] Very large numbers handled
- [ ] Empty strings handled

### Special Characters
- [ ] Medicine names with special chars
- [ ] Apostrophes in names
- [ ] Quotes in descriptions

### Date Handling
- [ ] Past dates handled
- [ ] Future dates handled
- [ ] Invalid dates rejected
- [ ] Timezone correct

---

## Regression Testing

After any changes, test:
- [ ] Login still works
- [ ] Setup wizard still works
- [ ] Billing still works
- [ ] Reports still work
- [ ] No new errors in console

---

## Production Readiness Checklist

### Code Quality
- [ ] No console.log in production
- [ ] Error handling comprehensive
- [ ] Input validation everywhere
- [ ] SQL injection prevented

### Security
- [ ] Passwords hashed
- [ ] No sensitive data logged
- [ ] Prepared statements used
- [ ] CORS configured

### Performance
- [ ] All critical paths < 1 sec
- [ ] Database indexed properly
- [ ] Queries optimized
- [ ] Memory usage acceptable

### Documentation
- [ ] README complete
- [ ] API documented
- [ ] Database documented
- [ ] User guide available

---

## User Acceptance Testing

### Pharmacy Owner Perspective
- [ ] Easy to learn
- [ ] Fast billing
- [ ] Accurate reports
- [ ] Meets requirements

### Operator Perspective
- [ ] Quick navigation
- [ ] Minimal clicks
- [ ] Clear workflow
- [ ] Error recovery

### Accountant Perspective
- [ ] GST reports accurate
- [ ] Data exportable
- [ ] Audit trail clear
- [ ] Compliance met

---

## Sign-Off

### Tested By: _______________
### Date: _______________
### Version: 1.0.0

### Overall Status
- [ ] All critical tests passed
- [ ] All high priority tests passed
- [ ] Known issues documented
- [ ] Ready for deployment

---

## Known Issues Log

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| | | | |

---

## Test Results Summary

- **Total Tests**: ___
- **Passed**: ___
- **Failed**: ___
- **Skipped**: ___
- **Pass Rate**: ___%

---

*Complete this checklist before deploying to production*
