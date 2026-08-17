/**
 * @file categories.ts
 * @description Category CRUD for expo-sqlite.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type { Category } from '@taskflow/shared'

export async function getAll(db: SQLite.SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY sort_order ASC, name ASC')
}

export async function create(
  db: SQLite.SQLiteDatabase,
  data: Omit<Category, 'id'>
): Promise<Category> {
  const result = await db.runAsync(
    'INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)',
    [data.name, data.icon, data.color, data.sort_order]
  )
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowId]) as Promise<Category>
}

export async function update(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: Partial<Omit<Category, 'id'>>
): Promise<Category | undefined> {
  const existing = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) return undefined
  const merged = {
    name:       data.name       ?? existing.name,
    icon:       data.icon       ?? existing.icon,
    color:      data.color      ?? existing.color,
    sort_order: data.sort_order ?? existing.sort_order,
  }
  await db.runAsync(
    'UPDATE categories SET name=?, icon=?, color=?, sort_order=? WHERE id=?',
    [merged.name, merged.icon, merged.color, merged.sort_order, id]
  )
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]) as Promise<Category>
}

export async function deleteCategory(db: SQLite.SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM categories WHERE id = ?', [id])
  return result.changes > 0
}

export async function reorder(db: SQLite.SQLiteDatabase, ids: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.runAsync('UPDATE categories SET sort_order=? WHERE id=?', [i, ids[i]])
    }
  })
}
