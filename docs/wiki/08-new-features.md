# New Features Guide

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

This page is the complete reference for all eight features added in the v0.2 update:
Tags · Sub-tasks · Pomodoro Timer · Heatmap · Weekly Review · Export · Drag-and-drop · Global Hotkey.

---

## Table of Contents

1. [Tags](#1-tags)
2. [Sub-tasks / Checklists](#2-sub-tasks--checklists)
3. [Pomodoro Timer](#3-pomodoro-timer)
4. [Activity Heatmap](#4-activity-heatmap)
5. [Weekly Review](#5-weekly-review)
6. [Export Data (CSV / JSON)](#6-export-data-csv--json)
7. [Drag-and-drop Reordering](#7-drag-and-drop-reordering)
8. [Global Hotkey](#8-global-hotkey)

---

## 1. Tags

Tags are free-form, colour-coded labels you can attach to any task. Unlike categories (a single hierarchical assignment), a task can have **multiple tags** — useful for cross-cutting concerns like `urgent`, `waiting`, `client-x`, or `deep-work`.

### Creating tags

Tags are created inline while editing or creating a task:

1. Open the task form (**+ Add Task** or **⋯ → Edit**)
2. Click the **Tags** field — a dropdown opens
3. Click any existing tag chip to **select / deselect** it
4. To create a new tag:
   - Type a name in the **"Tag name"** input
   - Click a colour from the swatch (10 presets)
   - Click **Add** or press **Enter**
5. The new tag is immediately selected and saved to the database

### Removing a tag from a task

Click the **×** on the coloured tag chip in either the dropdown or the task form field.

### Tag display

Tags appear as small coloured chips in the task card badge row, prefixed with 🏷:

```
💼 Office  medium  🏷 deep-work  🏷 urgent  ☑ 0/3
```

### Technical notes

- Tags are stored in the `tags` table (`id, name UNIQUE COLLATE NOCASE, color`)
- The join is managed via the `task_tags` table (`task_id, tag_id`)
- Tags are included in the **Tasks** CSV/JSON export as a comma-separated `tags` column
- The `tags:create` IPC channel uses `INSERT OR IGNORE` — creating a tag with a name that already exists returns the existing tag (case-insensitive)

---

## 2. Sub-tasks / Checklists

Every task can contain an expandable list of sub-tasks — lightweight checklist items that let you break a larger task into discrete steps without creating separate top-level tasks.

### Opening the checklist

On any task card, use **⋯ menu → 🔽 Show Sub-tasks**.  
Alternatively, click the **`☑ X/N`** progress badge if sub-tasks already exist.

### Adding sub-tasks

At the bottom of the expanded checklist:

1. Type the sub-task title in the input
2. Press **Enter** or click **+**

Sub-tasks appear in order immediately. There is no limit.

### Completing sub-tasks

Click the checkbox to the left of any sub-task. The **progress bar** at the top of the list fills proportionally and the counter `X/N` updates.

Completing sub-tasks does **not** automatically complete the parent task — they are independent.

### Deleting sub-tasks

Hover a sub-task row to reveal the **✕** delete button on the right.

### Reordering sub-tasks

Drag the **⠿** grip on the left of any sub-task row to a new position. The order is persisted immediately via the `subtasks:reorder` IPC channel.

### Technical notes

- Stored in the `subtasks` table: `id, task_id, title, completed (0/1), sort_order, created_at`
- `completed` is stored as SQLite INTEGER (0 / 1) and mapped to a TypeScript `boolean` by the DAL
- The `subtasks:reorder` channel accepts an ordered array of sub-task IDs and updates `sort_order` in a transaction

---

## 3. Pomodoro Timer

The built-in Pomodoro timer lets you start a focused work session directly from any task card without switching to a separate app.

### Starting a timer

Hover any task card → click the **🍅** button that appears in the top-right corner of the card. A timer popover opens.

### Phases

| Phase | Default | Trigger |
|---|---|---|
| 🍅 Focus | 25 min | On start and after every break |
| ☕ Short Break | 5 min | After each focus round |
| 🛋 Long Break | 15 min | After every 4th focus round |

Phases advance automatically when the timer reaches zero — no manual intervention needed.

### Controls

| Button | Action |
|---|---|
| **▶ Start** | Begin (or resume) the current phase |
| **⏸ Pause** | Pause the countdown |
| **⏭** | Skip to the next phase immediately |
| **↺** | Reset everything back to round 1, focus phase |

### Round indicator

Four small dots at the bottom show progress through the current 4-round cycle. Filled dots indicate completed focus rounds in this cycle.

### Audio cue

A short beep plays via the Web AudioContext API at the moment each phase ends — a gentle alert so you can work in another window without watching the timer.

### Page title countdown

While a timer is running, the browser/app window title updates every second:

```
23:45 🍅 Focus — Morning standup
```

This lets you monitor progress from the taskbar or dock without switching back to TaskFlow. The title resets to `TaskFlow` when paused or stopped.

### Multiple timers

Each task card maintains its own independent timer state — you can open timers for several cards simultaneously, though only one should be running at a time for focus effectiveness.

---

## 4. Activity Heatmap

The Heatmap gives you a bird's-eye view of your productivity over the past year — identical in concept to GitHub's contribution graph.

### Opening the heatmap

Click **🟩 Heatmap** in the sidebar.

### Reading the grid

- The grid spans **53 columns × 7 rows** — one cell per calendar day for approximately the last 365 days
- The **x-axis** (columns) represents weeks, oldest on the left
- The **y-axis** (rows) represents days of the week: Sunday (top) → Saturday (bottom)
- Month labels appear above the grid at each month boundary

### Colour scale

| Shade | Completions that day |
|---|---|
| ⬜ No colour | 0 — no activity |
| 🟩 Light green | 1 |
| 🟩 Medium green | 2–3 |
| 🟩 Dark green | 4–6 |
| 🟩 Max green | 7+ |

The exact hex colours adjust automatically between **Light mode** and **Dark mode**.

### Tooltip

Hover any cell to see a tooltip showing:
- Formatted date (e.g. `Mon, Jan 15`)
- `✅ 3 · ⏭ 1 · 📅 0` — completed / skipped / deferred counts

Future cells (after today) are shown in a muted background colour and have no tooltip.

### Summary line

Above the grid:

```
247 completions · 89 active days
```

### Technical notes

- Data comes from the `analytics:getHeatmapData` IPC channel (default: last 365 days)
- The SVG is rendered entirely in React with no external chart library
- Dark mode detection uses a `MutationObserver` on `document.documentElement.classList`

---

## 5. Weekly Review

The Weekly Review screen is a statistics dashboard for a single week — showing how productive you were and which areas need attention.

### Opening Weekly Review

Click **📊 Weekly Review** in the sidebar.

### Week navigation

| Button | Effect |
|---|---|
| **← Prev** | Go one week earlier |
| **This Week** | Jump back to the current week (shown when on a past week) |
| **Next →** | Go one week forward (disabled for the current week) |

The date range `Mon, Jan 13 – Sun, Jan 19` is shown below the heading.

### Completion rate ring

A large SVG donut ring in the centre of the first card. The colour indicates:

| Range | Colour |
|---|---|
| ≥ 80% | 🟢 Green |
| 50–79% | 🟡 Amber |
| < 50% | 🔴 Red |

The percentage is shown in the centre of the ring.

### Summary cards

Four metric tiles:

| Card | What it counts |
|---|---|
| 📋 Scheduled | Total occurrences recorded (completed + skipped + deferred) |
| ✅ Completed | Occurrences marked Done |
| ⏭ Skipped | Occurrences marked Skip |
| 📅 Deferred | Occurrences deferred to another day |

### By Priority

A progress-bar chart showing completed vs. total for each priority level (High, Medium, Low). Bars are coloured red / amber / green to match priority.

### By Category

A progress-bar chart showing completed vs. total per category, sorted by total activity (most active first).

### Top Streaks

A list of the top 5 tasks with the longest **current** consecutive-day streak. Streaks are counted backwards from yesterday.

```
🔥 Morning standup    14 days
🔥 30 min walk         7 days
🔥 Review budget       3 days
```

### Technical notes

- Data comes from `analytics:getWeeklyStats(weekOffset)` — `0` = this week, `-1` = last week, etc.
- `weekOffset` is relative to the current Monday; the backend computes the exact Mon–Sun date range
- The completion rate is `Math.round((completed / total_scheduled) * 100)`; returns 0 if nothing was scheduled

---

## 6. Export Data (CSV / JSON)

TaskFlow lets you export your complete task and completion data at any time.

### Opening Export

Click **⬇ Export Data** in the sidebar.

### Export types

| Export | Contents |
|---|---|
| **📋 Tasks** | All tasks — title, description, category, priority, due date, recurrence type, status, tags, created date |
| **📊 Completion History** | Full log of every occurrence — date, status (completed/skipped/deferred), deferred-to date, completion timestamp, notes |

### Format

| Format | Best for |
|---|---|
| **CSV** | Microsoft Excel, Google Sheets, LibreOffice Calc, data analysis scripts |
| **JSON** | Developers, automation, importing into other apps |

### Saving the file

- **Desktop (Electron):** A native OS **Save File dialog** opens. Navigate to your desired folder, rename the file if needed, click Save.
- **Browser mode:** The file **downloads automatically** to your browser's Downloads folder. No dialog appears.

Default filenames follow the pattern:
```
taskflow-tasks-2025-01-20.csv
taskflow-completions-2025-01-20.json
```

### CSV format details

All CSV values containing commas, quotes, or newlines are properly double-quoted and escaped. The first row is always a header row.

---

## 7. Drag-and-drop Reordering

You can manually set the display order of tasks in **Today** and **All Tasks** views, and also reorder **sub-tasks** within a checklist.

### Reordering tasks

1. Hover a task card to reveal the **⠿** handle on the far left
2. Click and drag to the desired position
3. A **blue ring** highlights the target slot as you drag
4. Release — the order is saved immediately via `tasks:reorder`

The list updates optimistically (before the server call) so there is no visual jitter.

### Reordering sub-tasks

The same mechanism works inside an open checklist:

1. Hover a sub-task row to show its **⠿** handle
2. Drag to the new position
3. Release — saved via `subtasks:reorder`

### Persistence

- Task order is stored in the `sort_order` column of the `tasks` table (added in migration v2)
- Sub-task order is stored in the `sort_order` column of the `subtasks` table
- The `tasks:reorder` IPC channel accepts an ordered array of task IDs and updates `sort_order` values in a single transaction

### Notes

- Custom order applies within a view. Sorting / filtering is applied first, then results are presented in your custom order within the filtered set.
- In browser mode, reordering works in-memory for the session but is not persisted between page refreshes.

---

## 8. Global Hotkey

The global keyboard shortcut lets you capture tasks instantly — even when TaskFlow is in the background or minimised to the system tray.

### The shortcut

| Platform | Shortcut |
|---|---|
| Windows / Linux | `Ctrl + Shift + Space` |
| macOS | `Cmd + Shift + Space` |

### What happens

1. If TaskFlow is minimised to the tray → the window is shown and brought to focus
2. If TaskFlow is in the background → the window is focused
3. The **Add Task** modal opens immediately
4. Start typing the task title — press **Enter** or click **Create Task** to save

You can dismiss the modal with **Escape** or click outside it if you triggered the hotkey by mistake.

### Registration

The hotkey is registered in `electron/main.ts` using Electron's `globalShortcut.register()` API:

```ts
globalShortcut.register('CommandOrControl+Shift+Space', () => {
  mainWindow.show(); mainWindow.focus()
  mainWindow.webContents.send('quick-add-task')
})
```

The renderer listens via `window.electronBridge.on('quick-add-task', handler)`.

The shortcut is **unregistered** when the app quits (`globalShortcut.unregisterAll()` in `before-quit`).

### Troubleshooting

**Hotkey does nothing / doesn't register:**

Another application on your system has already claimed `Ctrl+Shift+Space`. Common culprits:
- Some clipboard managers
- Language/input method switchers
- IDE shortcuts

Resolution: change the conflicting app's shortcut, or quit it before launching TaskFlow.

**Hotkey works but modal doesn't open:**

Check the browser console (DevTools → Console) for errors related to `electronBridge`. This usually indicates the `preload.ts` was not rebuilt after a code change — run `npm run build` and restart.

---

## Feature Matrix by Mode

| Feature | Desktop (Electron) | Browser (localhost) |
|---|---|---|
| Tags — create & assign | ✅ Persisted | ✅ In-memory |
| Tags — shown on cards | ✅ | ✅ |
| Sub-tasks | ✅ Persisted | ✅ In-memory |
| Sub-task drag-to-reorder | ✅ Persisted | ✅ In-memory |
| Pomodoro timer | ✅ Full | ✅ Full |
| Heatmap | ✅ Real data | ✅ Based on in-memory completions |
| Weekly Review | ✅ Real data | ✅ Based on in-memory completions |
| Export — Tasks | ✅ Save dialog | ✅ Browser download |
| Export — Completions | ✅ Save dialog | ✅ Browser download |
| Task drag-to-reorder | ✅ Persisted | ✅ In-memory |
| Global hotkey | ✅ System-wide | ❌ Not available (browser limitation) |
