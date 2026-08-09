# TaskFlow — Overview

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

**TaskFlow** is a cross-platform, offline-first daily task tracking desktop application. It is designed for individuals who want a private, fast, no-subscription personal productivity tool that works entirely on their own machine — no cloud, no login, no internet required.

TaskFlow is built with Electron, React, and TypeScript, and stores all data in a local SQLite database file on your device.

---

## Core Philosophy

| Principle | What it means |
|---|---|
| **Offline-first** | Works with zero internet. Data never leaves your device. |
| **Single-user** | Designed for one person on one machine. No accounts, no sync. |
| **Lightweight** | A single `.db` file on disk. No server, no daemon, no cloud agent. |
| **No subscription** | Free forever. No paywalls or feature tiers. |
| **Cross-platform** | Same codebase runs on Windows, macOS, and Linux. |

---

## What TaskFlow Does

### Core task management
- **Task creation** with title, description, category, priority, due date, due time, and schedule type
- **Tags** — free-form colour-coded labels, created inline; multiple tags per task
- **Sub-tasks / Checklists** — expandable checklist items inside each task with a progress bar
- **9 built-in categories** pre-seeded on first launch, covering the major areas of daily life
- **Recurring tasks** — daily, weekly, monthly, yearly, hourly, or custom cron expression
- **Per-occurrence completion tracking** — completing Monday's occurrence does not affect Tuesday
- **Drag-and-drop reordering** — manually sort tasks within any list view

### Completion & focus
- **Completion actions** — Done, Defer to Tomorrow, Defer to a specific date, Skip, Snooze
- **Streak tracking** — consecutive-day completion streaks shown on recurring task cards
- 🍅 **Pomodoro Timer** — built-in per-task focus timer (25 min work / 5 min break / 15 min long break) with audio alert and live page-title countdown

### Views & analytics
- **Today view** — tasks due today or recurring tasks scheduled for today
- **All Tasks view** — full task list with filter chips and full-text search
- **Calendar view** — monthly grid with task-density dots; click any day to inspect
- **Weekly Review** — completion rate ring, category and priority breakdowns, top streaks, week navigation
- **Heatmap** — GitHub-style 52-week activity grid for visualising long-term habits

### Desktop integration
- **Desktop notifications** with Snooze (5 / 10 / 30 min / 1 hour)
- **System tray** — app lives in tray when minimised; tooltip shows today's remaining count
- ⌨ **Global hotkey** — `Ctrl+Shift+Space` (macOS: `Cmd+Shift+Space`) opens the quick-add modal from anywhere

### Data
- **Export** — tasks and completion history to CSV or JSON at any time
- **Light and Dark mode** with system auto-detection

---

## Desktop vs Browser Mode

| Feature | Desktop (Electron) | Browser (localhost:5173) |
|---|---|---|
| Data persistence | ✅ SQLite on disk | ⚠️ In-memory only, lost on refresh |
| All 9 categories | ✅ Seeded from DB | ✅ Demo data in memory |
| Create/edit tasks | ✅ Saved to SQLite | ✅ Saved in memory for session |
| Sub-tasks & tags | ✅ Persisted | ✅ In-memory for session |
| Desktop notifications | ✅ Native OS via node-cron | ✅ Web Notifications API |
| Pomodoro timer | ✅ Full | ✅ Full |
| System tray | ✅ Full tray integration | ❌ Not available |
| Global hotkey | ✅ `Ctrl+Shift+Space` | ❌ Not available |
| Export | ✅ Native Save File dialog | ✅ Browser download |
| **Recommended for** | **Daily use** | **UI preview / development only** |

> **Important:** Browser mode (`http://localhost:5173`) is for development and UI testing only. All data is held in memory and lost on page refresh. For real daily task tracking, always use the Electron desktop app.

---

## Wiki Navigation

| Page | Topic |
|---|---|
| [01 — Overview](./01-overview.md) | This page |
| [02 — Installation](./02-installation.md) | Setup on Windows, macOS, Linux |
| [03 — Getting Started](./03-getting-started.md) | First launch, interface tour |
| [04 — Task Management](./04-task-management.md) | Create, edit, complete, sub-tasks, tags, recurring tasks |
| [05 — Notifications & Tray](./05-notifications-tray.md) | Notifications, snooze, system tray |
| [06 — Data & Backup](./06-data-backup.md) | Storage location, backup, reset, export |
| [07 — Developer Guide](./07-developer-guide.md) | Architecture, IPC, contributing |
| [08 — New Features Guide](./08-new-features.md) | Tags, sub-tasks, Pomodoro, heatmap, weekly review, export, drag-and-drop, global hotkey |
