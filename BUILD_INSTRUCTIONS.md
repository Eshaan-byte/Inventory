# Building Windows .exe Installer

## Current Situation

You are running on **macOS**, but want to build a **Windows .exe** installer.

### Options:

---

## Option 1: Build on Windows Machine (Recommended)

### Requirements:
- Windows 10/11 computer
- Node.js 18+ installed

### Steps:

1. **On your Windows machine**, clone the repository:
```bash
git clone https://github.com/Eshaan-byte/Inventory.git
cd Inventory
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the frontend:**
```bash
npm run build:frontend
```

4. **Build the Windows installer:**
```bash
npm run package:win
```

5. **Find the installer:**
```
dist/AI Builder Pharma Setup 1.0.0.exe
```

### What Happens:
- Creates a Windows NSIS installer
- ~150MB installer file
- One-click installation
- Desktop shortcut created
- Start menu entry added

---

## Option 2: Use GitHub Actions (CI/CD)

### Create `.github/workflows/build.yml`:

```yaml
name: Build Windows Installer

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build frontend
      run: npm run build:frontend

    - name: Build Windows installer
      run: npm run package:win

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: windows-installer
        path: dist/*.exe
```

### Usage:
1. Push this file to GitHub
2. Go to Actions tab
3. Run "Build Windows Installer" workflow
4. Download the .exe from artifacts

---

## Option 3: Build Web Version (Works Now!)

Since you're on macOS, you can create a **portable web version** that works everywhere:

### Steps:

1. **Build frontend:**
```bash
npm run build:frontend
```

2. **Package everything:**
```bash
# Create distribution folder
mkdir -p dist-web
cp -r dist-frontend dist-web/
cp -r backend dist-web/
cp package.json dist-web/
cp -r node_modules dist-web/
```

3. **Create launcher script:**
```bash
# dist-web/start.bat (for Windows)
@echo off
npm run dev:backend
start http://localhost:3000
```

4. **Zip and distribute:**
```bash
zip -r ai-builder-pharma-web.zip dist-web/
```

---

## What I Can Do Right Now (on macOS)

Let me prepare everything for you:

### 1. Build Frontend ✅
```bash
npm run build:frontend
```

### 2. Create Build Scripts ✅
I'll create scripts for Windows building

### 3. Create Portable Version ✅
Package as a portable web app

### 4. Update Documentation ✅
Add build instructions

---

## Recommended Approach

### For Production:

**Use Option 1** (Build on Windows)
- Most reliable
- Proper Windows installer
- Native performance
- Best user experience

### For Development/Testing:

**Use Web Version** (Option 3)
- Works on all platforms
- Easy to distribute
- No installation needed
- Same features

---

## Building Now (What We Can Do)

Let me build the frontend and create a portable package:

```bash
# 1. Build frontend
npm run build:frontend

# 2. Create portable package
# This will create a zip file you can run anywhere
```

---

## After Building on Windows

The installer will:
- ✅ Install to Program Files
- ✅ Create desktop shortcut
- ✅ Create start menu entry
- ✅ Register in Windows Apps
- ✅ Include uninstaller
- ✅ Auto-start option

---

## Notes

- **Icon**: Currently set to `assets/icon.ico` (needs to be created)
- **Size**: Installer will be ~100-150MB
- **Build Time**: 2-5 minutes on Windows
- **Platform**: Windows 10/11 (64-bit only)

---

## Next Steps

Choose your preferred option:

1. **Windows Computer Available?** → Use Option 1
2. **Use GitHub Actions?** → Use Option 2
3. **Quick Distribution?** → Use Option 3 (Web version)

Let me know which option you prefer, and I'll help you with the specifics!
