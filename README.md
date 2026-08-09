# TaskFlow — Daily Task Tracker

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

A cross-platform, offline-first desktop app for daily task tracking built with **Electron + React + TypeScript**, backed by a local **SQLite** database. No accounts. No cloud. No subscriptions. Your data stays on your machine.

---

## ⚠️ Desktop vs Browser Mode

| | Desktop (Electron) `npm run dev` | Browser `localhost:5173` |
|---|---|---|
| Data persistence | ✅ SQLite — survives restarts | ⚠️ **In-memory only — lost on refresh** |
| Categories | ✅ Seeded from DB | ✅ Demo data in memory |
| Notifications | ✅ Native OS via node-cron | ✅ Web Notifications API |
| System tray | ✅ Full | ❌ Not available |
| Snooze | ✅ Notification buttons + in-app | ✅ In-app button only |
| **Recommended for** | **Daily real use** | **UI preview / development only** |

> The browser mode exists for development preview. For actual task tracking, always use `npm run dev` (Electron desktop app).

---

## Features

### Task Management
- Create tasks with **title, description, category, priority, due date, due time, and schedule type**
- **Edit** any task at any time — click the title or use the ⋯ menu
- **Archive** tasks to hide them without losing history
- **Delete** tasks permanently with confirmation
- **Full-text search** on title and description

### Categories
- **9 built-in categories** pre-seeded on first launch:
  💼 Office/Professional · 🏃 Health & Fitness · 💰 Finance · 📚 Study/Academics · 🧘 Spiritual/Mindfulness · 🏠 Daily Personal · 💊 Daily Health · 📅 Weekday Tasks · 🎉 Weekend Tasks
- Filter the task list by clicking any category in the sidebar

### Recurrence
- **Daily** — every N days
- **Weekly** — on specific days of the week (Mon/Wed/Fri, etc.)
- **Monthly** — on a specific day of the month
- **Yearly** — on a specific day of a specific month
- **Hourly** — daily appearance with hourly notification interval
- **Custom cron** — full 5-field cron expression with built-in reference guide
- **End conditions** — never, ends on a date, or after N occurrences
- **Schedule type** per task: Any Day / Weekdays Only / Weekends Only

### Completion Actions (Today View)
- ✅ **Done** — marks the occurrence complete; recurring tasks stay active for tomorrow
- ⏭ **Tomorrow** — defer to tomorrow
- 📅 **Pick Day** — defer to any future date
- ⏭ **Skip** — skip today's occurrence
- 💤 **Snooze** — reschedule the reminder for 5 / 10 / 30 min or 1 hour
- **Undo** any action with one click

### Smart Views
- **Today** — shows only tasks due today or recurring tasks scheduled for today
- **All Tasks** — all tasks with Priority / Status / Schedule Type filter chips + search
- **Calendar** — monthly grid with task-density dots; click any day to see its tasks
- **Category views** — per-category filtered lists

### Notifications
- **Desktop notifications** (Electron) via `node-cron` — fire at task due time
- Default to **9:00 AM** when no due time is set
- **Snooze buttons** (5 / 10 / 30 min) in the Windows notification
- Clicking a notification opens TaskFlow to Today view
- **Web Notifications** (browser mode) via the Web Notifications API

### System Tray
- App **minimises to tray** on window close (does not quit)
- Tray tooltip shows remaining task count for today
- Right-click menu: Show TaskFlow · Today's Tasks · Quit

### Streak Tracking
- 🔥 Flame streak indicator on recurring tasks showing consecutive completion days

### Theme
- **Light / Dark mode** with manual toggle
- **System preference auto-detection** on first launch

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 28 |
| Frontend | React 18 + TypeScript |
| Build tool | electron-vite |
| UI components | shadcn/ui + Tailwind CSS |
| Database | SQLite via better-sqlite3 |
| Recurrence scheduling | node-cron |
| Packaging | electron-builder |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18 or later | https://nodejs.org — use LTS |
| Python | 3.x | Required by node-gyp for native modules |
| Windows Build Tools | — | Windows only — see Installation |
| Xcode CLT | — | macOS only — `xcode-select --install` |

---

## Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd daily-task-tracker

# Install dependencies
npm install

# Rebuild native SQLite module for Electron
npx electron-rebuild -f -w better-sqlite3

# Launch desktop app
npm run dev
```

See [INSTALL.md](./INSTALL.md) for detailed platform-specific instructions and troubleshooting.

---

## Build & Distribution

```bash
npm run build          # Production build (no installer)
npm run dist           # Build + installer for current platform
npm run dist:win       # Windows NSIS .exe installer
npm run dist:mac       # macOS .dmg
npm run dist:linux     # Linux .AppImage + .deb
```

Output goes to `dist/`.

---

## Data Storage

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\TaskFlow\tasks.db` |
| macOS | `~/Library/Application Support/TaskFlow/tasks.db` |
| Linux | `~/.config/TaskFlow/tasks.db` |

A single SQLite file. Copy it to back up. Delete it to reset.

---

## Using the App

### Creating a task
1. Click **+ Add Task** (top-right)
2. Enter title (required), then optionally: description, category, priority, due date/time, schedule type
3. Toggle **🔁 Recurrence** to On to set a repeat pattern
4. Click **Create Task**

### Completing tasks
Open **Today** view. Each task card shows action buttons. Click **✅ Done** to mark complete.

### Deferring tasks
Click **⏭ Tomorrow** or **📅 Pick Day** on a task card to push it to a future date.

### Snoozing a notification
- From the notification: click **Snooze 5 min / 10 min / 30 min**
- From the app: click **💤 Snooze** on the task card → choose duration

### Deleting a recurring task
- **Delete just today:** ⋯ menu → **⏩ Skip Today Only**
- **Delete the whole task:** ⋯ menu → **🗑 Delete All Occurrences**

### Resetting the database
```bash
# Quit the app first (tray → Quit), then:
# Windows
Remove-Item "$env:APPDATA\TaskFlow\tasks.db" -Force
# macOS / Linux
rm ~/Library/Application\ Support/TaskFlow/tasks.db
```
Relaunch — a fresh database is created with default categories.

---

## Project Structure

```
daily-task-tracker/
├── electron/
│   ├── main.ts                    Electron main process
│   ├── preload.ts                 contextBridge → window.taskApi
│   ├── db/                        SQLite data access layer
│   ├── ipc/                       IPC channel constants + handlers
│   ├── scheduler/                 Recurrence engine + notification scheduler
│   └── tray/                      System tray
├── src/
│   ├── App.tsx                    Root React component
│   ├── components/                UI components (Layout, Sidebar, TaskCard, etc.)
│   ├── pages/                     Views (Today, AllTasks, Category, Calendar)
│   ├── context/                   Global app state
│   ├── hooks/                     useTheme
│   ├── lib/                       mockApi (browser), browserNotifications, utils
│   └── types/                     TypeScript declarations
├── docs/wiki/                     Full documentation wiki
├── INSTALL.md                     Platform installation guide
├── electron.vite.config.ts
├── electron-builder.config.ts
└── package.json
```

---

## Documentation

Full documentation is in [`docs/wiki/`](./docs/wiki/):

| Page | Topic |
|---|---|
| [01 — Overview](./docs/wiki/01-overview.md) | What TaskFlow is, desktop vs browser |
| [02 — Installation](./docs/wiki/02-installation.md) | Windows, macOS, Linux setup |
| [03 — Getting Started](./docs/wiki/03-getting-started.md) | First launch, interface tour |
| [04 — Task Management](./docs/wiki/04-task-management.md) | Tasks, recurrence, completions, filters |
| [05 — Notifications & Tray](./docs/wiki/05-notifications-tray.md) | Notifications, snooze, tray |
| [06 — Data & Backup](./docs/wiki/06-data-backup.md) | Storage, backup, reset |
| [07 — Developer Guide](./docs/wiki/07-developer-guide.md) | Architecture, IPC, contributing |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Electron uninstall` on `npm run dev` | Extract cached zip manually — see [INSTALL.md](./INSTALL.md) |
| `better-sqlite3` error | `npx electron-rebuild -f -w better-sqlite3` |
| PowerShell script blocked | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| npm install skips scripts | `npm approve-scripts electron@28.3.3` then `npm install --foreground-scripts` |
| Notifications not appearing (Windows) | Settings → Notifications → TaskFlow → On |
| Categories missing in browser | Browser mode uses in-memory demo data — this is expected |

---

## Author

**Aditya Pratap Bhuyan**
🔗 [linkedin.com/in/adityabhuyan](https://linkedin.com/in/adityabhuyan)

---

## License

MIT
