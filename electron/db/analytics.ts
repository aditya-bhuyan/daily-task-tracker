/**
 * Analytics queries for the Weekly Review and Heatmap features.
 * All queries are read-only and work directly against the DB.
 */
import { getDb } from './database'

export interface WeeklyStats {
  week_start: string        // ISO date (Monday)
  week_end: string          // ISO date (Sunday)
  total_scheduled: number
  completed: number
  skipped: number
  deferred: number
  completion_rate: number   // 0–100
  by_category: CategoryStat[]
  by_priority: PriorityStat[]
  top_streaks: StreakEntry[]
}

export interface CategoryStat {
  category_id: number | null
  category_name: string
  category_icon: string
  completed: number
  total: number
}

export interface PriorityStat {
  priority: string
  completed: number
  total: number
}

export interface StreakEntry {
  task_id: number
  title: string
  streak: number
}

export interface HeatmapDay {
  date: string          // ISO
  completed: number
  skipped: number
  deferred: number
  total: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(d: Date): Date {
  const day = d.getDay()           // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(m.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

// ─── Weekly stats ─────────────────────────────────────────────────────────────

export function getWeeklyStats(weekOffset = 0): WeeklyStats {
  const db = getDb()

  // Compute week range (Mon–Sun)
  const now = new Date()
  const monday = mondayOf(now)
  monday.setDate(monday.getDate() + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const week_start = isoDate(monday)
  const week_end   = isoDate(sunday)

  // Completion counts in the week
  interface CompRow { status: string; cnt: number }
  const compRows = db.prepare<[string, string], CompRow>(`
    SELECT status, COUNT(*) AS cnt
    FROM task_completions
    WHERE occurrence_date >= ? AND occurrence_date <= ?
    GROUP BY status
  `).all(week_start, week_end)

  const completed = compRows.find(r => r.status === 'completed')?.cnt ?? 0
  const skipped   = compRows.find(r => r.status === 'skipped')?.cnt ?? 0
  const deferred  = compRows.find(r => r.status === 'deferred')?.cnt ?? 0
  const total_scheduled = completed + skipped + deferred

  const completion_rate = total_scheduled > 0
    ? Math.round((completed / total_scheduled) * 100)
    : 0

  // By category
  interface CatRow { category_id: number | null; category_name: string; category_icon: string; status: string; cnt: number }
  const catRows = db.prepare<[string, string], CatRow>(`
    SELECT
      t.category_id,
      COALESCE(c.name, 'Uncategorized') AS category_name,
      COALESCE(c.icon, '📋')           AS category_icon,
      tc.status,
      COUNT(*) AS cnt
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE tc.occurrence_date >= ? AND tc.occurrence_date <= ?
    GROUP BY t.category_id, tc.status
  `).all(week_start, week_end)

  const catMap = new Map<string, CategoryStat>()
  for (const r of catRows) {
    const key = String(r.category_id ?? 'null')
    if (!catMap.has(key)) {
      catMap.set(key, { category_id: r.category_id, category_name: r.category_name, category_icon: r.category_icon, completed: 0, total: 0 })
    }
    const entry = catMap.get(key)!
    entry.total += r.cnt
    if (r.status === 'completed') entry.completed += r.cnt
  }
  const by_category = [...catMap.values()].sort((a, b) => b.total - a.total)

  // By priority
  interface PriRow { priority: string; status: string; cnt: number }
  const priRows = db.prepare<[string, string], PriRow>(`
    SELECT t.priority, tc.status, COUNT(*) AS cnt
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.occurrence_date >= ? AND tc.occurrence_date <= ?
    GROUP BY t.priority, tc.status
  `).all(week_start, week_end)

  const priMap = new Map<string, PriorityStat>()
  for (const r of priRows) {
    if (!priMap.has(r.priority)) priMap.set(r.priority, { priority: r.priority, completed: 0, total: 0 })
    const entry = priMap.get(r.priority)!
    entry.total += r.cnt
    if (r.status === 'completed') entry.completed += r.cnt
  }
  const by_priority = [...priMap.values()]

  // Top streaks (top 5 tasks by current streak)
  interface StreakRow { task_id: number; title: string }
  const taskRows = db.prepare<[], StreakRow>(`
    SELECT DISTINCT tc.task_id, t.title
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.status = 'completed'
    ORDER BY tc.task_id
  `).all()

  const top_streaks: StreakEntry[] = []
  const streakStmt = db.prepare<[number, string], { cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM task_completions WHERE task_id = ? AND occurrence_date = ? AND status = 'completed'`
  )

  for (const { task_id, title } of taskRows) {
    let streak = 0
    const cursor = new Date()
    cursor.setDate(cursor.getDate() - 1)
    for (;;) {
      const dateStr = isoDate(cursor)
      const row = streakStmt.get(task_id, dateStr)
      if (!row || row.cnt === 0) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    if (streak > 0) top_streaks.push({ task_id, title, streak })
  }
  top_streaks.sort((a, b) => b.streak - a.streak)
  top_streaks.splice(5)   // keep top 5

  return { week_start, week_end, total_scheduled, completed, skipped, deferred, completion_rate, by_category, by_priority, top_streaks }
}

// ─── Heatmap (last N days) ────────────────────────────────────────────────────

export function getHeatmapData(days = 365): HeatmapDay[] {
  const db = getDb()
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)

  interface Row { date: string; status: string; cnt: number }
  const rows = db.prepare<[string, string], Row>(`
    SELECT occurrence_date AS date, status, COUNT(*) AS cnt
    FROM task_completions
    WHERE occurrence_date >= ? AND occurrence_date <= ?
    GROUP BY occurrence_date, status
    ORDER BY occurrence_date ASC
  `).all(isoDate(start), isoDate(end))

  const dayMap = new Map<string, HeatmapDay>()
  for (const r of rows) {
    if (!dayMap.has(r.date)) dayMap.set(r.date, { date: r.date, completed: 0, skipped: 0, deferred: 0, total: 0 })
    const d = dayMap.get(r.date)!
    if (r.status === 'completed') d.completed += r.cnt
    else if (r.status === 'skipped') d.skipped += r.cnt
    else if (r.status === 'deferred') d.deferred += r.cnt
    d.total += r.cnt
  }

  return [...dayMap.values()]
}

// ─── Export helpers ───────────────────────────────────────────────────────────

export interface ExportRow {
  task_id: number
  title: string
  description: string | null
  category: string
  priority: string
  due_date: string | null
  recurrence_type: string | null
  status: string
  tags: string
  created_at: string
}

export interface CompletionExportRow {
  task_id: number
  task_title: string
  occurrence_date: string
  status: string
  deferred_to: string | null
  completed_at: string | null
  notes: string | null
}

export function exportTasks(): ExportRow[] {
  const db = getDb()
  interface TaskExRow {
    task_id: number; title: string; description: string | null
    category: string; priority: string; due_date: string | null
    recurrence_type: string | null; status: string; created_at: string
  }
  const tasks = db.prepare<[], TaskExRow>(`
    SELECT t.id AS task_id, t.title, t.description,
      COALESCE(c.name, 'Uncategorized') AS category,
      t.priority, t.due_date,
      r.type AS recurrence_type,
      t.status, t.created_at
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN recurrences r ON t.recurrence_id = r.id
    ORDER BY t.id ASC
  `).all()

  const tagStmt = db.prepare<[number], { name: string }>(`
    SELECT tg.name FROM tags tg JOIN task_tags tt ON tt.tag_id = tg.id WHERE tt.task_id = ?
  `)

  return tasks.map(t => ({
    ...t,
    tags: tagStmt.all(t.task_id).map(r => r.name).join(', ')
  }))
}

export function exportCompletions(): CompletionExportRow[] {
  return getDb().prepare<[], CompletionExportRow>(`
    SELECT tc.task_id, t.title AS task_title,
      tc.occurrence_date, tc.status, tc.deferred_to, tc.completed_at, tc.notes
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    ORDER BY tc.occurrence_date DESC, tc.task_id ASC
  `).all()
}
