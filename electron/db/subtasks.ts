import { getDb } from './database'

export interface Subtask {
  id: number
  task_id: number
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

interface SubtaskRow {
  id: number
  task_id: number
  title: string
  completed: number   // SQLite stores as 0/1
  sort_order: number
  created_at: string
}

function rowToSubtask(row: SubtaskRow): Subtask {
  return { ...row, completed: row.completed === 1 }
}

export function getForTask(task_id: number): Subtask[] {
  return getDb()
    .prepare<[number], SubtaskRow>('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC, id ASC')
    .all(task_id)
    .map(rowToSubtask)
}

export function create(task_id: number, title: string, sort_order = 0): Subtask {
  const db = getDb()
  const result = db
    .prepare<[number, string, number]>('INSERT INTO subtasks (task_id, title, sort_order) VALUES (?, ?, ?)')
    .run(task_id, title, sort_order)
  return rowToSubtask(
    db.prepare<[number], SubtaskRow>('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid as number)!
  )
}

export function update(id: number, data: { title?: string; completed?: boolean; sort_order?: number }): Subtask | undefined {
  const db = getDb()
  const existing = db.prepare<[number], SubtaskRow>('SELECT * FROM subtasks WHERE id = ?').get(id)
  if (!existing) return undefined
  const merged = {
    title: data.title ?? existing.title,
    completed: data.completed !== undefined ? (data.completed ? 1 : 0) : existing.completed,
    sort_order: data.sort_order ?? existing.sort_order,
    id,
  }
  db.prepare<typeof merged>('UPDATE subtasks SET title = @title, completed = @completed, sort_order = @sort_order WHERE id = @id').run(merged)
  return rowToSubtask(db.prepare<[number], SubtaskRow>('SELECT * FROM subtasks WHERE id = ?').get(id)!)
}

export function deleteSubtask(id: number): boolean {
  return getDb().prepare<[number]>('DELETE FROM subtasks WHERE id = ?').run(id).changes > 0
}

export function reorder(task_id: number, ids: number[]): void {
  const db = getDb()
  const stmt = db.prepare<[number, number]>('UPDATE subtasks SET sort_order = ? WHERE id = ? AND task_id = ?')
  const run = db.transaction(() => { ids.forEach((id, i) => stmt.run(i, id, task_id)) })
  run()
}
