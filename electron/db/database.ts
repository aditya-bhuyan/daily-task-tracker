import BetterSqlite3 from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations'
import { DEFAULT_CATEGORIES } from './schema'

let _db: BetterSqlite3.Database | null = null

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    throw new Error('Database has not been initialized. Call initDatabase() first.')
  }
  return _db
}

export function initDatabase(): void {
  if (_db) return

  const dbPath = join(app.getPath('userData'), 'tasks.db')
  _db = new BetterSqlite3(dbPath)

  // Enable WAL mode for better concurrency
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  runMigrations(_db)
  seedDefaultCategories(_db)

  console.log(`[DB] Initialized at ${dbPath}`)
}

function seedDefaultCategories(db: BetterSqlite3.Database): void {
  const count = (db.prepare('SELECT COUNT(*) AS cnt FROM categories').get() as { cnt: number }).cnt
  if (count > 0) return

  const insert = db.prepare(
    'INSERT INTO categories (name, icon, color, sort_order) VALUES (@name, @icon, @color, @sort_order)'
  )
  const seedAll = db.transaction(() => {
    for (const cat of DEFAULT_CATEGORIES) {
      insert.run(cat)
    }
  })
  seedAll()
  console.log(`[DB] Seeded ${DEFAULT_CATEGORIES.length} default categories`)
}
