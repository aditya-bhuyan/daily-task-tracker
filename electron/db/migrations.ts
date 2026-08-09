import type { Database } from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'

interface Migration {
  version: number
  up: (db: Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      // Execute all DDL statements from schema (split on semicolons, skip empty)
      const statements = SCHEMA_SQL.split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      for (const stmt of statements) {
        db.prepare(stmt).run()
      }
    }
  },
  {
    version: 2,
    up: (db) => {
      // Add sort_order column to tasks (for drag-and-drop reordering)
      try { db.prepare(`ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`).run() } catch { /* already exists */ }
      // Subtasks table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run()
      // Tags table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          color TEXT NOT NULL DEFAULT '#6366f1'
        )
      `).run()
      // Task–Tag join table
      db.prepare(`
        CREATE TABLE IF NOT EXISTS task_tags (
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
          PRIMARY KEY (task_id, tag_id)
        )
      `).run()
      // New indexes
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order)`).run() } catch { /* ignore */ }
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)`).run() } catch { /* ignore */ }
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id)`).run() } catch { /* ignore */ }
    }
  }
]

export function runMigrations(db: Database): void {
  // Ensure the version-tracking table exists
  db.prepare(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run()

  const getVersion = db.prepare<[], { version: number }>(
    'SELECT MAX(version) AS version FROM db_version'
  )
  const row = getVersion.get()
  const currentVersion = row?.version ?? 0

  const pending = migrations.filter((m) => m.version > currentVersion)

  for (const migration of pending) {
    const applyMigration = db.transaction(() => {
      migration.up(db)
      db.prepare('INSERT INTO db_version (version) VALUES (?)').run(migration.version)
    })
    applyMigration()
    console.log(`[DB] Applied migration v${migration.version}`)
  }
}
