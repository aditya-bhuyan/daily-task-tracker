/**
 * @file completions.ts
 * @description Task completion CRUD for expo-sqlite.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type { TaskCompletion } from '@taskflow/shared'

async function upsert(
  db: SQLite.SQLiteDatabase,
  data: Omit<TaskCompletion, 'id'>
): Promise<TaskCompletion> {
  await db.runAsync(
    `INSERT INTO task_completions
       (task_id, occurrence_date, status, deferred_to, completed_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(task_id, occurrence_date) DO UPDATE SET
       status       = excluded.status,
       deferred_to  = excluded.deferred_to,
       completed_at = excluded.completed_at,
       notes        = excluded.notes`,
    [
      data.task_id,
      data.occurrence_date,
      data.status,
      data.deferred_to ?? null,
      data.completed_at ?? null,
      data.notes ?? null,
    ]
  )
  return db.getFirstAsync<TaskCompletion>(
    'SELECT * FROM task_completions WHERE task_id=? AND occurrence_date=?',
    [data.task_id, data.occurrence_date]
  ) as Promise<TaskCompletion>
}

export async function markComplete(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  occurrence_date: string,
  notes?: string
): Promise<TaskCompletion> {
  return upsert(db, {
    task_id,
    occurrence_date,
    status: 'completed',
    deferred_to: null,
    completed_at: new Date().toISOString(),
    notes: notes ?? null,
  })
}

export async function markDeferred(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  occurrence_date: string,
  deferred_to: string
): Promise<TaskCompletion> {
  return upsert(db, {
    task_id,
    occurrence_date,
    status: 'deferred',
    deferred_to,
    completed_at: null,
    notes: null,
  })
}

export async function markSkipped(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  occurrence_date: string
): Promise<TaskCompletion> {
  return upsert(db, {
    task_id,
    occurrence_date,
    status: 'skipped',
    deferred_to: null,
    completed_at: null,
    notes: null,
  })
}

export async function getForDate(db: SQLite.SQLiteDatabase, date: string): Promise<TaskCompletion[]> {
  return db.getAllAsync<TaskCompletion>(
    'SELECT * FROM task_completions WHERE occurrence_date=? ORDER BY task_id ASC',
    [date]
  )
}

export async function getHistory(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  limit = 30
): Promise<TaskCompletion[]> {
  return db.getAllAsync<TaskCompletion>(
    'SELECT * FROM task_completions WHERE task_id=? ORDER BY occurrence_date DESC LIMIT ?',
    [task_id, limit]
  )
}

export async function getStreak(db: SQLite.SQLiteDatabase, task_id: number): Promise<number> {
  let streak = 0
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - 1) // start from yesterday

  for (;;) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const row = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM task_completions WHERE task_id=? AND occurrence_date=? AND status='completed'`,
      [task_id, dateStr]
    )
    if (!row) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break // safety cap
  }

  return streak
}

export async function deleteForDate(
  db: SQLite.SQLiteDatabase,
  task_id: number,
  occurrence_date: string
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM task_completions WHERE task_id=? AND occurrence_date=?',
    [task_id, occurrence_date]
  )
  return result.changes > 0
}
