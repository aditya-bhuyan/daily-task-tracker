/**
 * @file database.ts
 * @description expo-sqlite database initialisation, migrations and seed data.
 *              Exports SQLiteProvider props for use in the root layout.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import { SCHEMA_SQL } from './schema'
import { DEFAULT_CATEGORIES, DB_NAME, DB_VERSION } from '@taskflow/shared'

// ─── Re-export for convenience ────────────────────────────────────────────────

export { DB_NAME }

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * Called once when the SQLiteProvider mounts.
 * Runs DDL and seeds default categories on a fresh install.
 */
export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  // Retrieve current user_version pragma
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = result?.user_version ?? 0

  if (currentVersion >= DB_VERSION) return

  // ── v1: create all tables ─────────────────────────────────────────────────
  if (currentVersion < 1) {
    await db.execAsync(SCHEMA_SQL)

    // Seed default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)',
        [cat.name, cat.icon, cat.color, cat.sort_order]
      )
    }
  }

  // ── v2: add sort_order to tasks (guard — already in SCHEMA_SQL) ───────────
  if (currentVersion < 2) {
    // Nothing extra needed; sort_order is already defined in v1 schema
    // This slot is reserved for future additive migrations
  }

  // Bump version
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`)
}
