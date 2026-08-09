import { getDb } from './database'
import type { TaskCompletion } from './types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function upsert(data: Omit<TaskCompletion, 'id'>): TaskCompletion {
  const db = getDb()
  db.prepare<Omit<TaskCompletion, 'id'>>(
    `INSERT INTO task_completions
       (task_id, occurrence_date, status, deferred_to, completed_at, notes)
     VALUES
       (@task_id, @occurrence_date, @status, @deferred_to, @completed_at, @notes)
     ON CONFLICT(task_id, occurrence_date) DO UPDATE SET
       status       = excluded.status,
       deferred_to  = excluded.deferred_to,
       completed_at = excluded.completed_at,
       notes        = excluded.notes`
  ).run(data)

  return db
    .prepare<[number, string], TaskCompletion>(
      'SELECT * FROM task_completions WHERE task_id = ? AND occurrence_date = ?'
    )
    .get(data.task_id, data.occurrence_date)!
}

export function markComplete(
  task_id: number,
  occurrence_date: string,
  notes?: string
): TaskCompletion {
  return upsert({
    task_id,
    occurrence_date,
    status: 'completed',
    deferred_to: null,
    completed_at: new Date().toISOString(),
    notes: notes ?? null
  })
}

export function markDeferred(
  task_id: number,
  occurrence_date: string,
  deferred_to: string
): TaskCompletion {
  return upsert({
    task_id,
    occurrence_date,
    status: 'deferred',
    deferred_to,
    completed_at: null,
    notes: null
  })
}

export function markSkipped(task_id: number, occurrence_date: string): TaskCompletion {
  return upsert({
    task_id,
    occurrence_date,
    status: 'skipped',
    deferred_to: null,
    completed_at: null,
    notes: null
  })
}

export function getForDate(date: string): TaskCompletion[] {
  return getDb()
    .prepare<[string], TaskCompletion>(
      'SELECT * FROM task_completions WHERE occurrence_date = ? ORDER BY task_id ASC'
    )
    .all(date)
}

export function getHistory(task_id: number, limit = 30): TaskCompletion[] {
  return getDb()
    .prepare<[number, number], TaskCompletion>(
      'SELECT * FROM task_completions WHERE task_id = ? ORDER BY occurrence_date DESC LIMIT ?'
    )
    .all(task_id, limit)
}

export function getStreak(task_id: number): number {
  // Walk backwards day-by-day from yesterday and count consecutive 'completed' entries
  const stmt = getDb().prepare<[number, string], TaskCompletion>(
    `SELECT * FROM task_completions
     WHERE task_id = ? AND occurrence_date = ? AND status = 'completed'`
  )

  let streak = 0
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - 1) // start from yesterday

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const row = stmt.get(task_id, dateStr)
    if (!row) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function deleteForTask(task_id: number): void {
  getDb()
    .prepare<[number]>('DELETE FROM task_completions WHERE task_id = ?')
    .run(task_id)
}

export function deleteForDate(task_id: number, occurrence_date: string): boolean {
  const result = getDb()
    .prepare<[number, string]>(
      'DELETE FROM task_completions WHERE task_id = ? AND occurrence_date = ?'
    )
    .run(task_id, occurrence_date)
  return result.changes > 0
}
