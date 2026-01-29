# Quick Start Guide - AI Builder Pharma

Get up and running in **5 minutes**! 🚀

---

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

Wait for all packages to download and install.

---

## Step 2: Start the Application (30 seconds)

```bash
npm run dev
```

This will start:
- ✅ Backend API server
- ✅ React frontend
- ✅ Electron desktop window

---

## Step 3: Initial Setup (2 minutes)

When the app opens, you'll see the **Setup Wizard**:

### Screen 1: Company Information
- Enter your pharmacy/company name
- Example: "ABC Medicals"
- Click **Continue**

### Screen 2: Admin Account
- Username: `admin` (or your choice)
- Password: (minimum 6 characters)
- Confirm password
- Click **Complete Setup**

---

## Step 4: Add Your First Medicine (1 minute)

1. Press `F3` or click **Medicines** in sidebar
2. Click **+ Add Medicine**
3. Fill in:
   - Medicine Name: `Paracetamol 500mg`
   - Salt Composition: `Paracetamol`
   - Manufacturer: `ABC Pharma`
   - HSN Code: `30049099`
   - GST %: `12`
4. Click **Add Medicine**

**Repeat for 5-10 common medicines**

---

## Step 5: Create Your First Bill (30 seconds)

1. Press `F2` or click **Billing** in sidebar
2. Press `F12` to focus on medicine search
3. Type medicine name (e.g., "para")
4. Select from dropdown
5. Select batch (will auto-create for demo)
6. Enter quantity
7. Click **Add to Bill**
8. Press `F9` to **Save Bill**

---

## 🎉 You're Ready!

### What's Next?

#### Master the Keyboard Shortcuts
- `F2` - Billing (most used)
- `F3` - Medicines
- `F4` - Purchases
- `F7` - Reports
- `F9` - Save Bill
- `ESC` - Clear Bill

#### Add More Data
1. **Suppliers** (F6)
   - Add your medicine suppliers

2. **Purchase Entry** (F4)
   - Enter purchase invoices
   - Creates batches with expiry dates

3. **Customers** (F5)
   - Add regular customers
   - Track credit limits

#### Explore Reports (F7)
- Stock Summary
- Expiry Alerts
- Sales Reports
- GST Reports

---

## Common First-Day Tasks

### Morning Routine
```
1. Open application
2. Check Dashboard (expiry alerts)
3. Start billing (F2)
```

### End of Day
```
1. Go to Reports (F7)
2. Check daily sales summary
3. Review stock levels
```

---

## Tips for Fast Billing

### Speed Tips
- Use `F12` to quickly jump to medicine search
- Type just 2-3 letters and press Enter
- Batch auto-selects (FIFO - first expiry first)
- Press `F9` to save instantly

### Billing Workflow
```
F2 (Open Billing)
  → F12 (Search Medicine)
    → Type & Select
      → Enter Quantity
        → Add to Bill
          → F9 (Save)
            → ESC (Clear for next bill)
```

---

## Need Help?

### Check These Files
1. **README.md** - Complete documentation
2. **DATABASE_SCHEMA.md** - Database structure
3. **DEVELOPMENT.md** - Developer guide

### Common Questions

**Q: Where is my data stored?**
A: `./data/pharma.db` (local SQLite database)

**Q: How do I backup data?**
A: Copy the `pharma.db` file to safe location

**Q: Can I run this offline?**
A: Yes! 100% offline application

**Q: What if I make a mistake?**
A: You can edit/delete records (except completed sales)

---

## Video Tutorial (Coming Soon)

1. Setup & Configuration (5 min)
2. Adding Medicines & Batches (10 min)
3. Fast Billing Workflow (5 min)
4. Reports & GST (10 min)

---

## Contact & Support

- Check troubleshooting in README.md
- Review API documentation
- Contact development team

---

## Success Checklist

After your first day, you should have:

- [x] Completed setup wizard
- [x] Added 20+ medicines
- [x] Created 5+ sample bills
- [x] Checked dashboard and reports
- [x] Learned keyboard shortcuts (F2-F9)

---

**Congratulations!** 🎉
You're now ready to use AI Builder Pharma for your pharmacy operations!

---

## Next Steps

1. **Day 2**: Add all your medicine inventory
2. **Day 3**: Enter purchase invoices with batches
3. **Day 4**: Train staff on billing workflow
4. **Day 5**: Go live with real operations

---

*For detailed documentation, see [README.md](./README.md)*
