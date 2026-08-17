/**
 * @file tags.ts
 * @description Tag CRUD and task-tag pivot operations for expo-sqlite.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type { Tag } from '@taskflow/shared'

export async function getAll(db: SQLite.SQLiteDatabase): Promise<Tag[]> {
  return db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name ASC')
}

export async function getForTask(db: SQLite.SQLiteDatabase, task_id: number): Promise<Tag[]> {
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN task_tags tt ON tt.tag_id = t.id
     WHERE tt.task_id = ?
     ORDER BY t.name ASC`,
    [task_id]
  )
}

export async function create(
  db: SQLite.SQLiteDatabase,
  name: string,
  color = '#6366f1'
): Promise<Tag> {
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)',
    [name.trim(), color]
  )
  return db.getFirstAsync<Tag>(
    'SELECT * FROM tags WHERE name = ? COLLATE NOCASE',
    [name.trim()]
  ) as Promise<Tag>
}

export async function update(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: Partial<Omit<Tag, 'id'>>
): Promise<Tag | undefined> {
  const existing = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id=?', [id])
  if (!existing) return undefined
  const merged = {
    name:  data.name  ?? existing.name,
    color: data.color ?? existing.color,
  }
  await db.runAsync(
    'UPDATE tags SET name=?, color=? WHERE id=?',
    [merged.name, merged.color, id]
  )
  return db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id=?', [id]) as Promise<Tag>
}

export async function deleteTag(db: SQLite.SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM tags WHERE id=?', [id])
  return result.changes > 0
}

export async function setTaskTags(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  tag_ids: number[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM task_tags WHERE task_id=?', [task_id])
    for (const tag_id of tag_ids) {
      await db.runAsync(
        'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)',
        [task_id, tag_id]
      )
    }
  })
}
