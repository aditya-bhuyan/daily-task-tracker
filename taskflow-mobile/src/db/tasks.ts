/**
 * @file tasks.ts
 * @description Task CRUD operations using expo-sqlite async API.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type {
  Task,
  TaskWithDetails,
  Recurrence,
  Category,
  TaskCompletion,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
} from '@taskflow/shared'
import { isDueOn, getOccurrencesInRange } from '@taskflow/shared'

// ─── Raw JOIN row ──────────────────────────────────────────────────────────────

interface TaskRow extends Task {
  cat_id: number | null
  cat_name: string | null
  cat_icon: string | null
  cat_color: string | null
  cat_sort_order: number | null
  rec_id: number | null
  rec_type: string | null
  rec_interval: number | null
  rec_days_of_week: string | null
  rec_day_of_month: number | null
  rec_month_of_year: number | null
  rec_custom_cron: string | null
  rec_ends_on: string | null
  rec_ends_after: number | null
  comp_id: number | null
  comp_occurrence_date: string | null
  comp_status: string | null
  comp_deferred_to: string | null
  comp_completed_at: string | null
  comp_notes: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

const TASK_SELECT = (dateParam: string) => `
  SELECT
    t.*,
    c.id         AS cat_id,
    c.name       AS cat_name,
    c.icon       AS cat_icon,
    c.color      AS cat_color,
    c.sort_order AS cat_sort_order,
    r.id            AS rec_id,
    r.type          AS rec_type,
    r.interval      AS rec_interval,
    r.days_of_week  AS rec_days_of_week,
    r.day_of_month  AS rec_day_of_month,
    r.month_of_year AS rec_month_of_year,
    r.custom_cron   AS rec_custom_cron,
    r.ends_on       AS rec_ends_on,
    r.ends_after    AS rec_ends_after,
    tc.id             AS comp_id,
    tc.occurrence_date AS comp_occurrence_date,
    tc.status         AS comp_status,
    tc.deferred_to    AS comp_deferred_to,
    tc.completed_at   AS comp_completed_at,
    tc.notes          AS comp_notes
  FROM tasks t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN recurrences r ON t.recurrence_id = r.id
  LEFT JOIN task_completions tc
    ON tc.task_id = t.id AND tc.occurrence_date = ${dateParam}
`

function rowToTask(row: TaskRow): TaskWithDetails {
  const task: TaskWithDetails = {
    id: row.id,
    title: row.title,
    description: row.description,
    category_id: row.category_id,
    priority: row.priority,
    due_date: row.due_date,
    due_time: row.due_time,
    recurrence_id: row.recurrence_id,
    schedule_type: row.schedule_type,
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  if (row.cat_id !== null) {
    task.category = {
      id: row.cat_id,
      name: row.cat_name!,
      icon: row.cat_icon!,
      color: row.cat_color!,
      sort_order: row.cat_sort_order!,
    } satisfies Category
  }

  if (row.rec_id !== null) {
    task.recurrence = {
      id: row.rec_id,
      type: row.rec_type as Recurrence['type'],
      interval: row.rec_interval!,
      days_of_week: row.rec_days_of_week,
      day_of_month: row.rec_day_of_month,
      month_of_year: row.rec_month_of_year,
      custom_cron: row.rec_custom_cron,
      ends_on: row.rec_ends_on,
      ends_after: row.rec_ends_after,
    }
  }

  if (row.comp_id !== null) {
    task.completion_today = {
      id: row.comp_id,
      task_id: row.id,
      occurrence_date: row.comp_occurrence_date!,
      status: row.comp_status as TaskCompletion['status'],
      deferred_to: row.comp_deferred_to,
      completed_at: row.comp_completed_at,
      notes: row.comp_notes,
    }
  }

  return task
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAll(db: SQLite.SQLiteDatabase, filters: TaskFilters = {}): Promise<TaskWithDetails[]> {
  const today = todayStr()
  const conditions: string[] = ['1=1']
  const params: (string | number)[] = []

  if (filters.status !== undefined && filters.status !== 'all') {
    conditions.push('t.status = ?')
    params.push(filters.status)
  } else if (filters.status === undefined) {
    conditions.push("t.status = 'active'")
  }

  if (filters.category_id !== undefined) {
    conditions.push('t.category_id = ?')
    params.push(filters.category_id)
  }

  if (filters.search) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.priority && filters.priority !== 'all') {
    conditions.push('t.priority = ?')
    params.push(filters.priority)
  }

  if (filters.schedule_type && filters.schedule_type !== 'all') {
    conditions.push('t.schedule_type = ?')
    params.push(filters.schedule_type)
  }

  const sql =
    TASK_SELECT(`'${today}'`) +
    ` WHERE ${conditions.join(' AND ')} ORDER BY t.due_date ASC, t.created_at ASC`

  const rows = await db.getAllAsync<TaskRow>(sql, params)
  return rows.map(rowToTask)
}

export async function getById(db: SQLite.SQLiteDatabase, id: number): Promise<TaskWithDetails | undefined> {
  const sql = TASK_SELECT('?') + ' WHERE t.id = ?'
  const row = await db.getFirstAsync<TaskRow>(sql, [todayStr(), id])
  return row ? rowToTask(row) : undefined
}

export async function getByDate(db: SQLite.SQLiteDatabase, date: string): Promise<TaskWithDetails[]> {
  const sql =
    TASK_SELECT('?') +
    ` WHERE t.status = 'active'
      AND (t.due_date = ? OR t.recurrence_id IS NOT NULL)
      ORDER BY t.sort_order ASC, t.due_date ASC, t.created_at ASC`
  const rows = await db.getAllAsync<TaskRow>(sql, [date, date])
  const candidates = rows.map(rowToTask)
  const target = new Date(date + 'T00:00:00')
  return candidates.filter((t) => isDueOn(t, target))
}

export async function getToday(db: SQLite.SQLiteDatabase): Promise<TaskWithDetails[]> {
  return getByDate(db, todayStr())
}

export async function getOccurrencesForMonth(
  db: SQLite.SQLiteDatabase,
  year: number,
  month: number
): Promise<Record<string, number>> {
  const today = todayStr()
  const sql = TASK_SELECT(`'${today}'`) + ` WHERE t.status = 'active'`
  const rows = await db.getAllAsync<TaskRow>(sql)
  const tasks = rows.map(rowToTask)

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  const counts: Record<string, number> = {}

  for (const task of tasks) {
    const occurrences = getOccurrencesInRange(task, startDate, endDate)
    for (const d of occurrences) {
      counts[d] = (counts[d] ?? 0) + 1
    }
  }

  return counts
}

// ─── Write ────────────────────────────────────────────────────────────────────

async function upsertRecurrence(
  db: SQLite.SQLiteDatabase,
  rec: Omit<Recurrence, 'id'>,
  existingId?: number | null
): Promise<number> {
  if (existingId) {
    await db.runAsync(
      `UPDATE recurrences SET type=?,interval=?,days_of_week=?,day_of_month=?,
       month_of_year=?,custom_cron=?,ends_on=?,ends_after=? WHERE id=?`,
      [rec.type, rec.interval, rec.days_of_week ?? null, rec.day_of_month ?? null,
       rec.month_of_year ?? null, rec.custom_cron ?? null, rec.ends_on ?? null,
       rec.ends_after ?? null, existingId]
    )
    return existingId
  }
  const result = await db.runAsync(
    `INSERT INTO recurrences (type,interval,days_of_week,day_of_month,month_of_year,custom_cron,ends_on,ends_after)
     VALUES (?,?,?,?,?,?,?,?)`,
    [rec.type, rec.interval, rec.days_of_week ?? null, rec.day_of_month ?? null,
     rec.month_of_year ?? null, rec.custom_cron ?? null, rec.ends_on ?? null, rec.ends_after ?? null]
  )
  return result.lastInsertRowId
}

export async function create(db: SQLite.SQLiteDatabase, data: CreateTaskInput): Promise<TaskWithDetails> {
  const { recurrence, ...taskData } = data
  let recurrence_id: number | null = taskData.recurrence_id ?? null

  if (recurrence) {
    recurrence_id = await upsertRecurrence(db, recurrence)
  }

  const result = await db.runAsync(
    `INSERT INTO tasks (title, description, category_id, priority, due_date, due_time,
     recurrence_id, schedule_type, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      taskData.title,
      taskData.description ?? null,
      taskData.category_id ?? null,
      taskData.priority ?? 'medium',
      taskData.due_date ?? null,
      taskData.due_time ?? null,
      recurrence_id,
      taskData.schedule_type ?? 'any',
      taskData.status ?? 'active',
      taskData.sort_order ?? 0,
    ]
  )

  return (await getById(db, result.lastInsertRowId))!
}

export async function update(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: UpdateTaskInput
): Promise<TaskWithDetails | undefined> {
  const existing = await getById(db, id)
  if (!existing) return undefined

  const { recurrence, ...taskData } = data
  let recurrence_id = existing.recurrence_id

  if (recurrence === null) {
    if (existing.recurrence_id) {
      await db.runAsync('DELETE FROM recurrences WHERE id = ?', [existing.recurrence_id])
    }
    recurrence_id = null
  } else if (recurrence !== undefined) {
    recurrence_id = await upsertRecurrence(db, recurrence, existing.recurrence_id ?? undefined)
  }

  await db.runAsync(
    `UPDATE tasks SET
      title=?, description=?, category_id=?, priority=?, due_date=?, due_time=?,
      recurrence_id=?, schedule_type=?, status=?, sort_order=?, updated_at=datetime('now')
     WHERE id=?`,
    [
      taskData.title ?? existing.title,
      taskData.description !== undefined ? taskData.description : existing.description,
      taskData.category_id !== undefined ? taskData.category_id : existing.category_id,
      taskData.priority ?? existing.priority,
      taskData.due_date !== undefined ? taskData.due_date : existing.due_date,
      taskData.due_time !== undefined ? taskData.due_time : existing.due_time,
      recurrence_id,
      taskData.schedule_type ?? existing.schedule_type,
      taskData.status ?? existing.status,
      taskData.sort_order ?? existing.sort_order,
      id,
    ]
  )

  return getById(db, id)
}

export async function deleteTask(db: SQLite.SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM tasks WHERE id = ?', [id])
  return result.changes > 0
}

export async function archive(db: SQLite.SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE tasks SET status='archived', updated_at=datetime('now') WHERE id=?`,
    [id]
  )
  return result.changes > 0
}

export async function reorder(db: SQLite.SQLiteDatabase, ids: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.runAsync('UPDATE tasks SET sort_order=? WHERE id=?', [i, ids[i]])
    }
  })
}
