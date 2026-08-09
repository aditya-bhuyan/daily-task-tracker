import { getDb } from './database'
import type { Task, TaskWithDetails, Recurrence } from './types'
import { create as createRecurrence, update as updateRecurrence, deleteRecurrence } from './recurrences'
import { isDueOn, getOccurrencesInRange } from '../scheduler/recurrenceEngine'

// Raw DB row shape returned by JOINed queries
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

const TASK_SELECT = (todayFilter: string) => `
  SELECT
    t.*,
    c.id         AS cat_id,
    c.name       AS cat_name,
    c.icon       AS cat_icon,
    c.color      AS cat_color,
    c.sort_order AS cat_sort_order,
    r.id           AS rec_id,
    r.type         AS rec_type,
    r.interval     AS rec_interval,
    r.days_of_week AS rec_days_of_week,
    r.day_of_month AS rec_day_of_month,
    r.month_of_year AS rec_month_of_year,
    r.custom_cron  AS rec_custom_cron,
    r.ends_on      AS rec_ends_on,
    r.ends_after   AS rec_ends_after,
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
    ON tc.task_id = t.id AND tc.occurrence_date = ${todayFilter}
`

function rowToTaskWithDetails(row: TaskRow): TaskWithDetails {
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
    created_at: row.created_at,
    updated_at: row.updated_at
  }

  if (row.cat_id !== null) {
    task.category = {
      id: row.cat_id,
      name: row.cat_name!,
      icon: row.cat_icon!,
      color: row.cat_color!,
      sort_order: row.cat_sort_order!
    }
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
      ends_after: row.rec_ends_after
    }
  }

  if (row.comp_id !== null) {
    task.completion_today = {
      id: row.comp_id,
      task_id: row.id,
      occurrence_date: row.comp_occurrence_date!,
      status: row.comp_status as 'completed' | 'skipped' | 'deferred',
      deferred_to: row.comp_deferred_to,
      completed_at: row.comp_completed_at,
      notes: row.comp_notes
    }
  }

  return task
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ────────────────────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────────────────────

export function getAll(
  filters: {
    category_id?: number
    status?: string
    search?: string
    priority?: string
    schedule_type?: string
  } = {}
): TaskWithDetails[] {
  let sql = TASK_SELECT(`'${today()}'`) + ' WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.status !== undefined && filters.status !== 'all') {
    sql += ' AND t.status = ?'
    params.push(filters.status)
  } else if (filters.status === undefined) {
    sql += " AND t.status = 'active'"
  }

  if (filters.category_id !== undefined) {
    sql += ' AND t.category_id = ?'
    params.push(filters.category_id)
  }

  if (filters.search) {
    sql += ' AND (t.title LIKE ? OR t.description LIKE ?)'
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.priority && filters.priority !== 'all') {
    sql += ' AND t.priority = ?'
    params.push(filters.priority)
  }

  if (filters.schedule_type && filters.schedule_type !== 'all') {
    sql += ' AND t.schedule_type = ?'
    params.push(filters.schedule_type)
  }

  sql += ' ORDER BY t.due_date ASC, t.created_at ASC'

  const rows = getDb().prepare<(string | number)[], TaskRow>(sql).all(...params)
  return rows.map(rowToTaskWithDetails)
}

export function getById(id: number): TaskWithDetails | undefined {
  const sql = TASK_SELECT('?') + ' WHERE t.id = ?'
  const row = getDb()
    .prepare<[string, number], TaskRow>(sql)
    .get(today(), id)
  return row ? rowToTaskWithDetails(row) : undefined
}

export function getByDate(date: string): TaskWithDetails[] {
  // Get one-time tasks due on this date + all recurring tasks, then filter
  const sql =
    TASK_SELECT('?') +
    ` WHERE t.status = 'active'
      AND (t.due_date = ? OR t.recurrence_id IS NOT NULL)
      ORDER BY t.due_date ASC, t.created_at ASC`
  const rows = getDb()
    .prepare<[string, string], TaskRow>(sql)
    .all(date, date)
  const allCandidates = rows.map(rowToTaskWithDetails)
  const targetDate = new Date(date + 'T00:00:00')
  return allCandidates.filter((task) => isDueOn(task, targetDate))
}

export function getTodayTasks(): TaskWithDetails[] {
  return getByDate(today())
}

/**
 * Returns a map of ISO date string → task count for a given year/month.
 * Used by the calendar view to show task density dots.
 */
export function getOccurrencesForMonth(year: number, month: number): Record<string, number> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  // Fetch all active tasks
  const sql = TASK_SELECT(`'${today()}'`) + ` WHERE t.status = 'active'`
  const rows = getDb().prepare<[], TaskRow>(sql).all()
  const tasks = rows.map(rowToTaskWithDetails)

  const counts: Record<string, number> = {}

  for (const task of tasks) {
    const occurrences = getOccurrencesInRange(task, startDate, endDate)
    for (const dateStr of occurrences) {
      counts[dateStr] = (counts[dateStr] ?? 0) + 1
    }
  }

  return counts
}

// ────────────────────────────────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────────────────────────────────

type CreateInput = Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
  recurrence?: Omit<Recurrence, 'id'>
}

export function create(data: CreateInput): TaskWithDetails {
  const db = getDb()
  const { recurrence, ...taskData } = data

  let recurrence_id: number | null = taskData.recurrence_id ?? null
  if (recurrence) {
    const rec = createRecurrence(recurrence)
    recurrence_id = rec.id
  }

  const row = {
    title: taskData.title,
    description: taskData.description ?? null,
    category_id: taskData.category_id ?? null,
    priority: taskData.priority ?? 'medium',
    due_date: taskData.due_date ?? null,
    due_time: taskData.due_time ?? null,
    recurrence_id,
    schedule_type: taskData.schedule_type ?? 'any',
    status: taskData.status ?? 'active'
  }

  const result = db
    .prepare<typeof row>(
      `INSERT INTO tasks
         (title, description, category_id, priority, due_date, due_time,
          recurrence_id, schedule_type, status)
       VALUES
         (@title, @description, @category_id, @priority, @due_date, @due_time,
          @recurrence_id, @schedule_type, @status)`
    )
    .run(row)

  return getById(result.lastInsertRowid as number)!
}

type UpdateInput = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>> & {
  recurrence?: Omit<Recurrence, 'id'> | null
}

export function update(id: number, data: UpdateInput): TaskWithDetails | undefined {
  const db = getDb()
  const existing = getById(id)
  if (!existing) return undefined

  const { recurrence, ...taskData } = data

  let recurrence_id = existing.recurrence_id

  if (recurrence === null) {
    // Remove recurrence
    if (existing.recurrence_id) {
      deleteRecurrence(existing.recurrence_id)
    }
    recurrence_id = null
  } else if (recurrence !== undefined) {
    if (existing.recurrence_id) {
      updateRecurrence(existing.recurrence_id, recurrence)
    } else {
      const rec = createRecurrence(recurrence)
      recurrence_id = rec.id
    }
  }

  const merged = {
    title: taskData.title ?? existing.title,
    description: taskData.description !== undefined ? taskData.description : existing.description,
    category_id: taskData.category_id !== undefined ? taskData.category_id : existing.category_id,
    priority: taskData.priority ?? existing.priority,
    due_date: taskData.due_date !== undefined ? taskData.due_date : existing.due_date,
    due_time: taskData.due_time !== undefined ? taskData.due_time : existing.due_time,
    recurrence_id,
    schedule_type: taskData.schedule_type ?? existing.schedule_type,
    status: taskData.status ?? existing.status
  }

  db.prepare<typeof merged & { id: number }>(
    `UPDATE tasks
     SET title = @title,
         description = @description,
         category_id = @category_id,
         priority = @priority,
         due_date = @due_date,
         due_time = @due_time,
         recurrence_id = @recurrence_id,
         schedule_type = @schedule_type,
         status = @status,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...merged, id })

  return getById(id)
}

export function deleteTask(id: number): boolean {
  const result = getDb()
    .prepare<[number]>('DELETE FROM tasks WHERE id = ?')
    .run(id)
  return result.changes > 0
}

export function archive(id: number): boolean {
  const result = getDb()
    .prepare<[number]>(`UPDATE tasks SET status = 'archived', updated_at = datetime('now') WHERE id = ?`)
    .run(id)
  return result.changes > 0
}
