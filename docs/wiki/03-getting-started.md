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
┌──────────────────────────────────────────────────────────────────┐
│  Sidebar (240px)          │  Main Content Area                   │
│                           │                                      │
│  ✅ TaskFlow              │  [Header: View title] [+ Add Task]   │
│  ───────────────          │  ──────────────────────────────────  │
│  📅 Today                 │                                      │
│  📋 All Tasks             │   Task cards appear here             │
│  🗓  Calendar             │                                      │
│  📊 Weekly Review         │   Each card shows:                   │
│  🟩 Heatmap               │   • Title  🍅 ⋯                     │
│  ⬇  Export Data           │   • Category · Priority · Tags      │
│  ───────────────          │   • ☑ 2/4  🔁 daily                 │
│  CATEGORIES               │   • ✅ Done ⏭ Tomorrow 💤 Snooze   │
│  💼 Office                │                                      │
│  🏃 Health                │                                      │
│  💰 Finance               │                                      │
│  📚 Study                 │                                      │
│  🧘 Spiritual             │                                      │
│  🏠 Daily Personal        │                                      │
│  💊 Daily Health          │                                      │
│  📅 Weekday Tasks         │                                      │
│  🎉 Weekend Tasks         │                                      │
│  ───────────────          │                                      │
│  ☀️ Light  [toggle]       │                                      │
│  v0.1.0                   │                                      │
└───────────────────────────────────────────────────────────────────┘
```

### Sidebar navigation

| Item | What it shows |
|---|---|
| 📅 **Today** | Tasks due today + active recurring tasks for today |
| 📋 **All Tasks** | Every active task — filters + full-text search |
| 🗓 **Calendar** | Monthly grid with task-density dots per day |
| 📊 **Weekly Review** | Completion rate, streaks, category/priority breakdowns |
| 🟩 **Heatmap** | GitHub-style 52-week activity grid |
| ⬇ **Export Data** | Export tasks or completions to CSV or JSON |
| **Category items** | Click any category to see only its tasks |
| **Theme toggle** | Switch Light ↔ Dark mode (persisted across sessions) |

### Main area

- **Header** — shows the current view name, today's date, and the **+ Add Task** button
- **Task cards** — each shows title, category badge, priority, tags, sub-task progress, recurrence type, due time, completion actions, and streak flame
- The **🍅** button on each card opens a built-in Pomodoro focus timer
- The **⋯** button reveals the context menu (Edit, Sub-tasks, Move to Tomorrow, Archive, Delete)

---

## Creating Your First Task

1. Click **+ Add Task** (top-right) — or press `Ctrl+Shift+Space` from anywhere on your desktop
2. Enter a **Title** (required)
3. Optionally set:
   - Description
   - Category (dropdown — 9 built-in options)
   - Priority: Low / Medium / High
   - Due Date and/or Due Time
   - Schedule Type: Any Day / Weekdays Only / Weekends Only
   - **Tags** — click the 🏷 field to pick or create colour-coded tags
4. To make it recurring, toggle **🔁 Recurrence** → On, then choose a recurrence type and end condition
5. Click **Create Task**

The task appears immediately in the list.

---

## Adding Sub-tasks to a Task

After creating a task, open the **⋯** menu → **🔽 Show Sub-tasks**. An inline checklist appears:

- Type a sub-task title and press **Enter** (or click **+**) to add
- Click the checkbox to mark a sub-task complete — the progress bar updates live
- Drag the **⠿** handle to reorder sub-tasks
- Click **✕** to delete a sub-task

The task card badge shows progress: `☑ 2/4`.

---

## Views at a Glance

### Today View
Shows tasks due today and recurring tasks scheduled for today. Drag any card by its **⠿** handle to manually reorder.  
Each card shows: **✅ Done · ⏭ Tomorrow · 📅 Pick Day · ⏭ Skip · 💤 Snooze**

### All Tasks View
All active tasks with a filter bar. Filter by Priority, Status, Schedule Type. Search by title/description. Cards are drag-and-drop reorderable.

### Calendar View
Monthly grid. Days with tasks show a blue count badge. Click a day to see its tasks below the grid. Navigate months with **← Prev** / **Next →**.

### Weekly Review
A statistics dashboard for any past week:
- Completion rate ring (green ≥80%, amber ≥50%, red <50%)
- Summary cards: scheduled / completed / skipped / deferred
- Progress bars by category and by priority
- Top 5 current streaks
- Navigate with **← Prev** / **This Week** / **Next →**

### Heatmap
GitHub-style 53×7 SVG grid covering the past 365 days. Each cell represents one day — colour intensity shows how many tasks were completed. Hover a cell for a tooltip showing the exact counts.

### Export Data
Choose **Tasks** or **Completion History**, select **CSV** or **JSON**, and click **⬇ Export**.
- **Desktop**: a native Save File dialog appears
- **Browser**: the file downloads automatically

### Category View
Click any sidebar category to see only tasks in that category, with the same filter bar as All Tasks.

---

## Pomodoro Timer

Hover any task card and click the **🍅** button in the top-right corner of the card.

| Phase | Duration |
|---|---|
| 🍅 Focus | 25 minutes |
| ☕ Short Break | 5 minutes |
| 🛋 Long Break | 15 minutes (every 4th round) |

The browser tab title updates to `MM:SS 🍅 Focus — Task Name` so you can see the countdown while working in other windows. An audio beep signals each phase transition.

Controls: **▶ Start / ⏸ Pause · ⏭ Skip · ↺ Reset**

---

## Global Hotkey

Press **`Ctrl+Shift+Space`** (macOS: **`Cmd+Shift+Space`**) from **anywhere on your desktop** — even when TaskFlow is minimised to the system tray — to:
1. Bring the TaskFlow window to the front
2. Immediately open the **Add Task** modal

This is the fastest way to capture a task the moment it comes to mind.

---

## System Tray

Clicking the window's close (✕) button **minimises to tray** — the app does not quit.

- **Left-click** tray icon → show/focus window
- **Right-click** → Show TaskFlow · Today's Tasks · Quit
- Tray tooltip shows remaining tasks today

To fully quit: right-click tray → **Quit** (or `File → Quit`).

---

## Light / Dark Mode

Click the **☀️ / 🌙** toggle at the bottom of the sidebar. Your preference is saved and auto-applied on next launch. The app also auto-detects your system's colour scheme on first run. The Heatmap colour scale adjusts automatically to match the current theme.
