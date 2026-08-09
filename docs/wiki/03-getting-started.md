# Getting Started

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

This page walks you through launching TaskFlow for the first time and understanding the interface.

---

## First Launch

After completing [installation](../../INSTALL.md):

```bash
cd daily-task-tracker
npm run dev
```

On first launch:
- The SQLite database is created automatically at your platform's app data path
- **9 default categories** are seeded automatically and appear in the sidebar
- The app opens to **Today** view

---

## The Interface

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (240px)         │  Main Content Area                 │
│                          │                                    │
│  ✅ TaskFlow             │  [Header: View title] [+ Add Task] │
│  ──────────────          │  ────────────────────────────────  │
│  📅 Today                │                                    │
│  📋 All Tasks            │   Task cards appear here           │
│  🗓 Calendar             │                                    │
│  ──────────────          │                                    │
│  CATEGORIES              │                                    │
│  💼 Office               │                                    │
│  🏃 Health               │                                    │
│  💰 Finance              │                                    │
│  📚 Study                │                                    │
│  🧘 Spiritual            │                                    │
│  🏠 Daily Personal       │                                    │
│  💊 Daily Health         │                                    │
│  📅 Weekday Tasks        │                                    │
│  🎉 Weekend Tasks        │                                    │
│  ──────────────          │                                    │
│  ☀️ Light  [toggle]      │                                    │
│  v0.1.0                  │                                    │
└──────────────────────────────────────────────────────────────┘
```

### Sidebar
- **Today** — tasks due today + active recurring tasks scheduled for today
- **All Tasks** — every active task with filters and search
- **Calendar** — monthly calendar view
- **Categories** — click any category to see only its tasks
- **Theme toggle** — switch between Light and Dark mode

### Main area
- **Header** shows the current view name and today's date
- **+ Add Task** button opens the task creation modal
- Task cards are listed below the header

---

## Creating Your First Task

1. Click **+ Add Task** in the top-right header
2. Enter a **Title** (required)
3. Optionally set:
   - Description
   - Category (dropdown, 9 options)
   - Priority: Low / Medium / High
   - Due Date and/or Due Time
   - Schedule Type: Any Day / Weekdays Only / Weekends Only
4. To make it recurring, toggle **🔁 Recurrence** → On, then choose a recurrence type
5. Click **Create Task**

The task appears immediately in the list.

---

## Views at a Glance

### Today View
Shows tasks due today and recurring tasks scheduled for today.  
Each card shows: **✅ Done · ⏭ Tomorrow · 📅 Pick Day · ⏭ Skip · 💤 Snooze**

### All Tasks View
All active tasks with a filter bar. Filter by Priority, Status, Schedule Type. Search by title/description.

### Calendar View
Monthly grid. Days with tasks show a blue count badge. Click a day to see its tasks below the grid. Navigate months with **← Prev** / **Next →**.

### Category View
Click any sidebar category to see only tasks in that category, with the same filter bar.

---

## System Tray

Clicking the window's close (✕) button **minimises to tray** — the app does not quit.

- **Left-click** tray icon → show/focus window
- **Right-click** → Show TaskFlow · Today's Tasks · Quit
- Tray tooltip shows remaining tasks today

To fully quit: right-click tray → **Quit**.

---

## Light / Dark Mode

Click the **☀️ / 🌙** toggle at the bottom of the sidebar. Your preference is saved and auto-applied on next launch. The app also auto-detects your system's colour scheme on first run.
