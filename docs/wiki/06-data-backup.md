# Data & Backup

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

---

## Storage Location

All data lives in a single SQLite file:

| Platform | Path |
|---|---|
| **Windows** | `%APPDATA%\TaskFlow\tasks.db` |
| **macOS** | `~/Library/Application Support/TaskFlow/tasks.db` |
| **Linux** | `~/.config/TaskFlow/tasks.db` |

### What is stored

| Table | Contents |
|---|---|
| `categories` | All categories — name, icon, colour, sort order |
| `tasks` | All tasks with every field, including `sort_order` |
| `recurrences` | Recurrence rules linked to tasks |
| `task_completions` | Every done / deferred / skipped log entry |
| `subtasks` | Sub-task checklist items per task |
| `tags` | Free-form colour-coded label definitions |
| `task_tags` | Many-to-many join between tasks and tags |

---

## Exporting Your Data

TaskFlow can export data at any time — no need to touch the SQLite file directly.

1. Click **⬇ Export Data** in the sidebar
2. Choose **Tasks** or **Completion History**
3. Select **CSV** (for spreadsheets) or **JSON** (for scripts)
4. Click **⬇ Export**
   - **Desktop**: a native Save File dialog appears — choose where to save
   - **Browser mode**: the file downloads automatically to your Downloads folder

### CSV column reference

**Tasks export:**

| Column | Description |
|---|---|
| `task_id` | Internal task ID |
| `title` | Task title |
| `description` | Optional notes |
| `category` | Category name |
| `priority` | low / medium / high |
| `due_date` | ISO date (YYYY-MM-DD) or empty |
| `recurrence_type` | daily / weekly / … or empty |
| `status` | active / archived |
| `tags` | Comma-separated tag names |
| `created_at` | ISO timestamp |

**Completion History export:**

| Column | Description |
|---|---|
| `task_id` | Task ID |
| `task_title` | Task title at time of export |
| `occurrence_date` | ISO date of the occurrence |
| `status` | completed / skipped / deferred |
| `deferred_to` | ISO date if deferred, else empty |
| `completed_at` | ISO timestamp if completed, else empty |
| `notes` | Optional completion note |

---

## Manual Backup

```bash
# Windows (PowerShell)
Copy-Item "$env:APPDATA\TaskFlow\tasks.db" `
  "$env:USERPROFILE\Desktop\tasks-backup-$(Get-Date -Format yyyyMMdd).db"

# macOS
cp ~/Library/Application\ Support/TaskFlow/tasks.db \
   ~/Desktop/tasks-backup-$(date +%Y%m%d).db

# Linux
cp ~/.config/TaskFlow/tasks.db \
   ~/Desktop/tasks-backup-$(date +%Y%m%d).db
```

Tip: copy `tasks.db` to cloud storage (Dropbox, OneDrive, Google Drive) for off-site backup.

---

## Restoring a Backup

1. Quit TaskFlow fully: tray → **Quit**
2. Replace the database file:

```bash
# Windows
Copy-Item "C:\path\to\backup.db" "$env:APPDATA\TaskFlow\tasks.db" -Force

# macOS
cp ~/Desktop/tasks-backup-20250115.db \
   ~/Library/Application\ Support/TaskFlow/tasks.db

# Linux
cp ~/Desktop/tasks-backup-20250115.db ~/.config/TaskFlow/tasks.db
```

3. Relaunch TaskFlow

---

## Resetting to a Clean Database

Removes all tasks, completions, sub-tasks, tags, and custom categories. The 9 default categories are re-seeded on next launch.

1. Quit TaskFlow: tray → **Quit**
2. Delete the file:

```bash
# Windows
Remove-Item "$env:APPDATA\TaskFlow\tasks.db" -Force

# macOS
rm ~/Library/Application\ Support/TaskFlow/tasks.db

# Linux
rm ~/.config/TaskFlow/tasks.db
```

3. Relaunch

---

## Browser Mode — Data Warning

In browser mode (`http://localhost:5173`), **all data is stored in memory only** and is lost when:
- The page is refreshed
- The browser tab is closed
- The browser is restarted

Browser mode is for development and UI preview only. **Use the desktop app for real task tracking.**

---

## Database Schema Reference

```sql
-- Migration v1 (initial schema)

CREATE TABLE categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  icon       TEXT    NOT NULL DEFAULT '📋',
  color      TEXT    NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE recurrences (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT    NOT NULL CHECK(type IN ('daily','weekly','monthly','yearly','hourly','custom')),
  interval        INTEGER NOT NULL DEFAULT 1,
  days_of_week    TEXT,           -- JSON array e.g. "[1,3,5]"
  day_of_month    INTEGER,
  month_of_year   INTEGER,
  custom_cron     TEXT,
  ends_on         TEXT,           -- ISO date
  ends_after      INTEGER
);

CREATE TABLE tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT    NOT NULL,
  description    TEXT,
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  priority       TEXT    NOT NULL DEFAULT 'medium',
  due_date       TEXT,            -- ISO date
  due_time       TEXT,            -- HH:MM
  recurrence_id  INTEGER REFERENCES recurrences(id) ON DELETE SET NULL,
  schedule_type  TEXT    NOT NULL DEFAULT 'any',
  status         TEXT    NOT NULL DEFAULT 'active',
  sort_order     INTEGER NOT NULL DEFAULT 0,   -- added in migration v2
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE task_completions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id          INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date  TEXT    NOT NULL,
  status           TEXT    NOT NULL CHECK(status IN ('completed','skipped','deferred')),
  deferred_to      TEXT,
  completed_at     TEXT,
  notes            TEXT,
  UNIQUE(task_id, occurrence_date)
);

-- Migration v2 (sub-tasks, tags)

CREATE TABLE subtasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,   -- 0=false, 1=true
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE COLLATE NOCASE,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```
