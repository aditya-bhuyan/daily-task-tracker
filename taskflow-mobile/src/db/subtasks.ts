/**
 * @file subtasks.ts
 * @description Subtask CRUD for expo-sqlite.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type { Subtask } from '@taskflow/shared'

interface SubtaskRow {
  id: number
  task_id: number
  title: string
  completed: number // SQLite 0/1
  sort_order: number
  created_at: string
}

function rowToSubtask(row: SubtaskRow): Subtask {
  return { ...row, completed: row.completed === 1 }
}

export async function getForTask(db: SQLite.SQLiteDatabase, task_id: number): Promise<Subtask[]> {
  const rows = await db.getAllAsync<SubtaskRow>(
    'SELECT * FROM subtasks WHERE task_id=? ORDER BY sort_order ASC, id ASC',
    [task_id]
  )
  return rows.map(rowToSubtask)
}

export async function create(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  title: string,
  sort_order = 0
): Promise<Subtask> {
  const result = await db.runAsync(
    'INSERT INTO subtasks (task_id, title, sort_order) VALUES (?, ?, ?)',
    [task_id, title, sort_order]
  )
  const row = await db.getFirstAsync<SubtaskRow>(
    'SELECT * FROM subtasks WHERE id=?',
    [result.lastInsertRowId]
  )
  return rowToSubtask(row!)
}

export async function update(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: { title?: string; completed?: boolean; sort_order?: number }
): Promise<Subtask | undefined> {
  const existing = await db.getFirstAsync<SubtaskRow>(
    'SELECT * FROM subtasks WHERE id=?',
    [id]
  )
  if (!existing) return undefined

  const merged = {
    title:      data.title      ?? existing.title,
    completed:  data.completed !== undefined ? (data.completed ? 1 : 0) : existing.completed,
    sort_order: data.sort_order ?? existing.sort_order,
  }

  await db.runAsync(
    'UPDATE subtasks SET title=?, completed=?, sort_order=? WHERE id=?',
    [merged.title, merged.completed, merged.sort_order, id]
  )

  const row = await db.getFirstAsync<SubtaskRow>('SELECT * FROM subtasks WHERE id=?', [id])
  return row ? rowToSubtask(row) : undefined
}

export async function deleteSubtask(db: SQLite.SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM subtasks WHERE id=?', [id])
  return result.changes > 0
}

export async function reorder(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  ids: number[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.runAsync(
        'UPDATE subtasks SET sort_order=? WHERE id=? AND task_id=?',
        [i, ids[i], task_id]
      )
    }
  })
}
