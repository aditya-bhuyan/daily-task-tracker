import { getDb } from './database'
import type { Category } from './types'

export function getAll(): Category[] {
  return getDb()
    .prepare<[], Category>('SELECT * FROM categories ORDER BY sort_order ASC')
    .all()
}

export function getById(id: number): Category | undefined {
  return getDb()
    .prepare<[number], Category>('SELECT * FROM categories WHERE id = ?')
    .get(id)
}

export function create(data: Omit<Category, 'id'>): Category {
  const db = getDb()
  const result = db
    .prepare<Omit<Category, 'id'>>(
      'INSERT INTO categories (name, icon, color, sort_order) VALUES (@name, @icon, @color, @sort_order)'
    )
    .run(data)
  return getById(result.lastInsertRowid as number)!
}

export function update(id: number, data: Partial<Omit<Category, 'id'>>): Category | undefined {
  const existing = getById(id)
  if (!existing) return undefined

  const merged = { ...existing, ...data }
  getDb()
    .prepare<Omit<Category, 'id'> & { id: number }>(
      `UPDATE categories
       SET name = @name, icon = @icon, color = @color, sort_order = @sort_order
       WHERE id = @id`
    )
    .run({ ...merged, id })

  return getById(id)
}

export function deleteCategory(id: number): boolean {
  const result = getDb()
    .prepare<[number]>('DELETE FROM categories WHERE id = ?')
    .run(id)
  return result.changes > 0
}

export function reorder(ids: number[]): void {
  const db = getDb()
  const update = db.prepare<[number, number]>(
    'UPDATE categories SET sort_order = ? WHERE id = ?'
  )
  const runAll = db.transaction(() => {
    ids.forEach((id, index) => update.run(index + 1, id))
  })
  runAll()
}
