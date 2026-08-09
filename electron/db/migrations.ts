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
