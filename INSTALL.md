# TaskFlow — Installation Guide

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

Step-by-step setup instructions for **Windows**, **macOS**, and **Linux**.

---

## Prerequisites (All Platforms)

| Requirement | Minimum Version | Where to get it |
|---|---|---|
| Node.js | 18 LTS or later | https://nodejs.org |
| npm | 9 or later | Bundled with Node.js |
| Git | Any recent | https://git-scm.com |
| Python | 3.x | https://python.org (needed by node-gyp) |

Verify your environment before starting:
```bash
node --version    # v18.x or higher
npm --version     # 9.x or higher
python --version  # 3.x
git --version
```

---

## Windows

### 1. Install Node.js
Download the **Windows LTS installer** from https://nodejs.org.  
During installation, ensure **"Add to PATH"** is checked.

### 2. Install C++ Build Tools
`better-sqlite3` is a native Node.js module and must be compiled.

**Option A — Visual Studio Build Tools (recommended)**
1. Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run the installer → select **"Desktop development with C++"** workload → Install

**Option B — Global npm package (run as Administrator)**
```powershell
npm install --global windows-build-tools
```

### 3. Fix PowerShell execution policy
By default, Windows blocks `.ps1` scripts. Fix this once:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Clone and install
```powershell
git clone <repo-url>
cd daily-task-tracker
npm install
```

If you see `allow-scripts` warnings, approve each package:
```powershell
npm approve-scripts electron@28.3.3
npm approve-scripts esbuild@0.21.5
npm approve-scripts better-sqlite3@9.6.0
npm install --foreground-scripts
```

### 5. Rebuild native SQLite module
```powershell
npx electron-rebuild -f -w better-sqlite3
```

### 6. Launch
```powershell
npm run dev
```

The TaskFlow window opens. Data is stored at:
```
%APPDATA%\TaskFlow\tasks.db
# e.g. C:\Users\YourName\AppData\Roaming\TaskFlow\tasks.db
```

---

### Windows Troubleshooting

#### `Electron uninstall` error
The Electron binary zip was downloaded but not extracted. Fix:
```powershell
# Find the cached zip (hash in folder name varies)
$cacheDir = "$env:LOCALAPPDATA\electron\Cache"
$zip = Get-ChildItem $cacheDir -Recurse -Filter "*.zip" | Select-Object -First 1 -ExpandProperty FullName
Write-Host "Found: $zip"

# Extract it
Expand-Archive -Path $zip -DestinationPath node_modules\electron\dist -Force

# Write the path hint file
Set-Content -Path node_modules\electron\path.txt -Value "electron.exe" -NoNewline

# Verify
node -e "const ep = require('electron'); const fs = require('fs'); console.log('OK:', fs.existsSync(ep))"
```

#### `better-sqlite3` binding error on launch
```powershell
npx electron-rebuild -f -w better-sqlite3
```

#### npm install hangs or fails on native modules
```powershell
# Check node-gyp is available
npx node-gyp --version

# If missing, install globally
npm install -g node-gyp
```

---

## macOS

### 1. Install Xcode Command Line Tools
```bash
xcode-select --install
```
Follow the on-screen prompt. This installs `clang`, `make`, and other build tools required for native modules.

### 2. Install Node.js

**Option A — Official pkg installer**
Download from https://nodejs.org (LTS).

**Option B — Homebrew (recommended)**
```bash
brew install node
```

**Option C — nvm (version manager)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal, then:
nvm install --lts
nvm use --lts
```

### 3. Verify Python 3
```bash
python3 --version
```
If missing: `brew install python3`

### 4. Clone and install
```bash
git clone <repo-url>
cd daily-task-tracker
npm install
```

### 5. Rebuild native SQLite module
```bash
npx electron-rebuild -f -w better-sqlite3
```

### 6. Launch
```bash
npm run dev
```

Data is stored at:
```
~/Library/Application Support/TaskFlow/tasks.db
```

---

### macOS Troubleshooting

#### `gyp: No Xcode or CLT version detected`
```bash
sudo xcode-select --reset
sudo xcode-select --switch /Library/Developer/CommandLineTools
```

#### `electron: command not found`
```bash
# Run via npx
npx electron --version

# Or reinstall
npm install electron --save-dev
```

#### App blocked by Gatekeeper on first run
In development mode (`npm run dev`), Gatekeeper does not apply — this only affects packaged builds. If you build with `npm run dist:mac`, you would need to sign and notarise the app with an Apple Developer certificate for distribution.

#### `node-pre-gyp` or `node-gyp rebuild` fails
Ensure Xcode CLT is fully installed:
```bash
xcode-select -p         # Should print a path
clang --version         # Should print version info
```
If still failing:
```bash
sudo rm -rf $(xcode-select -print-path)
xcode-select --install
```

---

## Linux

### 1. Install Node.js

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora / RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

**nvm (any distro):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal, then:
nvm install --lts
```

### 2. Install build dependencies
```bash
# Ubuntu / Debian
sudo apt-get install -y build-essential python3 libsecret-1-dev

# Fedora
sudo dnf install -y gcc gcc-c++ make python3

# Arch
sudo pacman -S base-devel python
```

### 3. Install desktop notification support
```bash
# Ubuntu / Debian
sudo apt-get install -y libnotify-bin

# Fedora
sudo dnf install -y libnotify
```

### 4. Clone and install
```bash
git clone <repo-url>
cd daily-task-tracker
npm install
```

### 5. Rebuild native SQLite module
```bash
npx electron-rebuild -f -w better-sqlite3
```

### 6. Launch
```bash
npm run dev
```

Data is stored at:
```
~/.config/TaskFlow/tasks.db
```

---

### Linux Troubleshooting

#### SUID sandbox error
```bash
# For development only — not needed in production builds
npx electron-vite dev -- --no-sandbox
```

#### `libgconf-2.so.4: cannot open shared object file`
```bash
sudo apt-get install -y libgconf-2-4
```

#### Tray icon not visible on GNOME
```bash
sudo apt-get install -y gnome-shell-extension-appindicator
# Then enable in GNOME Extensions app
```

#### No notifications on minimal desktop environments (i3, sway, etc.)
Install a notification daemon:
```bash
sudo apt-get install -y dunst
dunst &   # start the daemon
```

---

## Building a Distributable Package

Once `npm run dev` works, you can build an installer:

```bash
npm run dist          # Current platform
npm run dist:win      # Windows NSIS installer (.exe)
npm run dist:mac      # macOS disk image (.dmg)
npm run dist:linux    # Linux AppImage + .deb
```

Output is placed in the `dist/` directory.

> Cross-platform builds (e.g. building a `.exe` on macOS) require a CI pipeline such as GitHub Actions. Build on the target platform for local packaging.

---

## Custom App Icon

1. Create a 512×512 PNG image (`icon.png`)
2. Place it at `resources/icon.png`
3. For Windows: also provide `resources/icon.ico` (multi-size ICO file)
4. For macOS: also provide `resources/icon.icns`
5. Run `npm run dist` — electron-builder picks up icons automatically

Tools to convert PNG to ICO/ICNS:
- **Windows:** https://icoconvert.com
- **macOS:** `iconutil` (built-in), or https://cloudconvert.com/png-to-icns
- **Cross-platform:** ImageMagick: `convert icon.png -resize 256x256 icon.ico`
