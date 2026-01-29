# Development Guide

## Setup Development Environment

### 1. Prerequisites
- Node.js v18+ installed
- Code editor (VS Code recommended)
- Git for version control

### 2. Initial Setup
```bash
# Install dependencies
npm install

# Copy environment file (optional)
cp .env.example .env

# Start development servers
npm run dev
```

This starts:
1. **Backend** (port 3000) - Express API with SQLite
2. **Frontend** (port 5173) - React with Vite
3. **Electron** - Desktop window

---

## Development Workflow

### Running Individual Services

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Electron only (requires frontend running)
npm run dev:electron
```

### Hot Reload
- Frontend: Auto-reloads on file changes (Vite HMR)
- Backend: Auto-restarts on file changes (nodemon)
- Electron: Requires manual restart

---

## Database Development

### Location
- Dev database: `./data/pharma.db`
- Created automatically on first run

### Reset Database
```bash
# Delete database to start fresh
rm -rf data/pharma.db

# Restart backend - will recreate database
npm run dev:backend
```

### View Database
Use SQLite browser tools:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- VS Code extension: SQLite Viewer

### Schema Changes
1. Edit `backend/database/init.js`
2. Delete `data/pharma.db`
3. Restart backend

---

## Adding New Features

### 1. Add New API Endpoint

**Step 1**: Create route file
```javascript
// backend/routes/newfeature.js
const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

router.get('/', (req, res) => {
  // Implementation
});

module.exports = router;
```

**Step 2**: Register in server.js
```javascript
const newfeatureRoutes = require('./routes/newfeature');
app.use('/api/newfeature', newfeatureRoutes);
```

### 2. Add New Frontend Page

**Step 1**: Create page component
```javascript
// src/pages/NewFeature.jsx
const NewFeature = () => {
  return <div>New Feature</div>;
};
export default NewFeature;
```

**Step 2**: Add route in App.jsx
```javascript
<Route path="/newfeature" element={<NewFeature />} />
```

**Step 3**: Add to navigation in Layout.jsx
```javascript
{ name: 'New Feature', path: '/newfeature', icon: '🎯' }
```

### 3. Add Database Table

Edit `backend/database/init.js`:
```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

---

## Code Style Guidelines

### Backend (JavaScript)
- Use `const`/`let`, not `var`
- Use async/await for promises
- Handle errors with try/catch
- Use prepared statements for queries
- Always validate input

### Frontend (React)
- Functional components only
- Use hooks (useState, useEffect)
- Keep components small and focused
- Use TailwindCSS for styling
- Follow existing naming conventions

### Database
- Use snake_case for tables/columns
- Add indexes for foreign keys
- Use transactions for multi-step operations
- Add comments for complex queries

---

## Testing

### Manual Testing
1. Start dev environment
2. Complete setup wizard
3. Test each module:
   - Add medicines
   - Create batches
   - Make sales
   - Check reports

### API Testing
Use tools like:
- Postman
- Thunder Client (VS Code)
- curl

Example:
```bash
curl http://localhost:3000/api/health
```

---

## Debugging

### Backend Debugging
```javascript
// Add console.log statements
console.log('Debug:', variable);

// Check database
const row = db.prepare('SELECT * FROM medicines WHERE id = ?').get(1);
console.log(row);
```

### Frontend Debugging
```javascript
// React DevTools (browser extension)
// Console logs
console.log('State:', state);

// Check API calls in Network tab
```

### Electron Debugging
```javascript
// Main process: Check terminal output
console.log('Electron:', message);

// Renderer process: F12 DevTools
```

---

## Building for Production

### Step 1: Test build
```bash
npm run build
```

### Step 2: Package Electron app
```bash
npm run package:win
```

### Step 3: Test installer
- Install on clean Windows machine
- Test all features
- Check database location

---

## Common Issues

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <pid> /F
```

### Database Locked
- Close all app instances
- Delete `pharma.db-wal` and `pharma.db-shm` files
- Restart

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Electron Not Starting
```bash
# Clear cache
rm -rf node_modules/.cache
npm run dev
```

---

## Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Active development
- `feature/xxx` - New features

### Commit Messages
```
feat: Add customer search in billing
fix: Resolve batch expiry validation
docs: Update API documentation
style: Format code with prettier
refactor: Simplify sales calculation
```

---

## Performance Tips

### Database
- Use indexes on frequently queried columns
- Use transactions for bulk operations
- Avoid SELECT * in production queries

### Frontend
- Lazy load components
- Debounce search inputs
- Use React.memo for expensive components
- Optimize re-renders with proper dependencies

### Backend
- Use prepared statements
- Cache frequent queries
- Minimize API calls

---

## Security Checklist

- [ ] All passwords are hashed
- [ ] SQL injection prevented (prepared statements)
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs
- [ ] CORS configured properly
- [ ] User authentication required

---

## Deployment Checklist

- [ ] Test all features thoroughly
- [ ] Check database migrations
- [ ] Update version number
- [ ] Test on target Windows version
- [ ] Create installer
- [ ] Test installer on clean machine
- [ ] Prepare user documentation
- [ ] Backup strategy in place

---

## Next Steps for Development

### Immediate Priorities
1. ✅ Complete core billing (done)
2. Complete purchase entry UI
3. Add print functionality
4. Enhance reports with filtering

### Phase 2 Features
1. AI medicine suggestions
2. Auto backup system
3. Barcode support
4. Advanced reports

### Phase 3 Features
1. Multi-user support
2. Cloud sync (optional)
3. Mobile companion app
4. E-commerce integration

---

## Resources

### Documentation
- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

### Tools
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [Postman](https://www.postman.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

## Questions?

For development questions:
1. Check this guide
2. Review existing code
3. Check documentation links
4. Contact development team
