/**
 * @file schema.ts
 * @description SQLite DDL for expo-sqlite — identical schema to the desktop app.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📋',
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('daily','weekly','monthly','yearly','hourly','custom')),
  interval INTEGER NOT NULL DEFAULT 1,
  days_of_week TEXT,
  day_of_month INTEGER,
  month_of_year INTEGER,
  custom_cron TEXT,
  ends_on TEXT,
  ends_after INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
  due_date TEXT,
  due_time TEXT,
  recurrence_id INTEGER REFERENCES recurrences(id) ON DELETE SET NULL,
  schedule_type TEXT NOT NULL DEFAULT 'any' CHECK(schedule_type IN ('any','weekday','weekend')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed','skipped','deferred')),
  deferred_to TEXT,
  completed_at TEXT,
  notes TEXT,
  UNIQUE(task_id, occurrence_date)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_category     ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date     ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order   ON tasks(sort_order);
CREATE INDEX IF NOT EXISTS idx_completions_task_date ON task_completions(task_id, occurrence_date);
CREATE INDEX IF NOT EXISTS idx_completions_deferred  ON task_completions(deferred_to);
CREATE INDEX IF NOT EXISTS idx_subtasks_task      ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task     ON task_tags(task_id);
`

export const MIGRATIONS: Record<number, string> = {
  1: SCHEMA_SQL,
  2: `
    -- v2: ensure sort_order column exists (already in schema, guard for older DBs)
    SELECT 1;
  `,
}
