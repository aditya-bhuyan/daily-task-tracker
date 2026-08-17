/**
 * @file analytics.ts
 * @description Analytics queries for Weekly Review, Heatmap and Export.
 *              Async re-implementation of the desktop analytics module.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as SQLite from 'expo-sqlite'
import type {
  WeeklyStats,
  CategoryStat,
  PriorityStat,
  StreakEntry,
  HeatmapDay,
  ExportRow,
  CompletionExportRow,
} from '@taskflow/shared'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(m.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

// ─── Weekly stats ─────────────────────────────────────────────────────────────

export async function getWeeklyStats(
  db: SQLite.SQLiteDatabase,
  weekOffset = 0
): Promise<WeeklyStats> {
  const now = new Date()
  const monday = mondayOf(now)
  monday.setDate(monday.getDate() + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const week_start = isoDate(monday)
  const week_end   = isoDate(sunday)

  // ── Overall counts ──────────────────────────────────────────────────────────
  interface CompRow { status: string; cnt: number }
  const compRows = await db.getAllAsync<CompRow>(
    `SELECT status, COUNT(*) AS cnt FROM task_completions
     WHERE occurrence_date >= ? AND occurrence_date <= ? GROUP BY status`,
    [week_start, week_end]
  )

  const completed        = compRows.find(r => r.status === 'completed')?.cnt ?? 0
  const skipped          = compRows.find(r => r.status === 'skipped')?.cnt   ?? 0
  const deferred         = compRows.find(r => r.status === 'deferred')?.cnt  ?? 0
  const total_scheduled  = completed + skipped + deferred
  const completion_rate  = total_scheduled > 0
    ? Math.round((completed / total_scheduled) * 100)
    : 0

  // ── By category ─────────────────────────────────────────────────────────────
  interface CatRow {
    category_id: number | null
    category_name: string
    category_icon: string
    status: string
    cnt: number
  }
  const catRows = await db.getAllAsync<CatRow>(
    `SELECT t.category_id,
       COALESCE(c.name,'Uncategorized') AS category_name,
       COALESCE(c.icon,'📋')           AS category_icon,
       tc.status, COUNT(*) AS cnt
     FROM task_completions tc
     JOIN tasks t ON tc.task_id = t.id
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE tc.occurrence_date >= ? AND tc.occurrence_date <= ?
     GROUP BY t.category_id, tc.status`,
    [week_start, week_end]
  )

  const catMap = new Map<string, CategoryStat>()
  for (const r of catRows) {
    const key = String(r.category_id ?? 'null')
    if (!catMap.has(key)) {
      catMap.set(key, {
        category_id:   r.category_id,
        category_name: r.category_name,
        category_icon: r.category_icon,
        completed: 0,
        total:     0,
      })
    }
    const entry = catMap.get(key)!
    entry.total += r.cnt
    if (r.status === 'completed') entry.completed += r.cnt
  }
  const by_category = [...catMap.values()].sort((a, b) => b.total - a.total)

  // ── By priority ─────────────────────────────────────────────────────────────
  interface PriRow { priority: string; status: string; cnt: number }
  const priRows = await db.getAllAsync<PriRow>(
    `SELECT t.priority, tc.status, COUNT(*) AS cnt
     FROM task_completions tc
     JOIN tasks t ON tc.task_id = t.id
     WHERE tc.occurrence_date >= ? AND tc.occurrence_date <= ?
     GROUP BY t.priority, tc.status`,
    [week_start, week_end]
  )

  const priMap = new Map<string, PriorityStat>()
  for (const r of priRows) {
    if (!priMap.has(r.priority))
      priMap.set(r.priority, { priority: r.priority, completed: 0, total: 0 })
    const entry = priMap.get(r.priority)!
    entry.total += r.cnt
    if (r.status === 'completed') entry.completed += r.cnt
  }
  const by_priority = [...priMap.values()]

  // ── Top streaks ─────────────────────────────────────────────────────────────
  interface TaskRow { task_id: number; title: string }
  const taskRows = await db.getAllAsync<TaskRow>(
    `SELECT DISTINCT tc.task_id, t.title
     FROM task_completions tc JOIN tasks t ON tc.task_id = t.id
     WHERE tc.status = 'completed' ORDER BY tc.task_id`
  )

  const top_streaks: StreakEntry[] = []
  for (const { task_id, title } of taskRows) {
    let streak = 0
    const cursor = new Date()
    cursor.setDate(cursor.getDate() - 1)
    for (let day = 0; day < 365; day++) {
      const dateStr = isoDate(cursor)
      const row = await db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM task_completions
         WHERE task_id=? AND occurrence_date=? AND status='completed'`,
        [task_id, dateStr]
      )
      if (!row || row.cnt === 0) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    if (streak > 0) top_streaks.push({ task_id, title, streak })
  }
  top_streaks.sort((a, b) => b.streak - a.streak)
  top_streaks.splice(5)

  return {
    week_start, week_end,
    total_scheduled, completed, skipped, deferred,
    completion_rate, by_category, by_priority, top_streaks,
  }
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export async function getHeatmapData(
  db: SQLite.SQLiteDatabase,
  days = 365
): Promise<HeatmapDay[]> {
  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)

  interface Row { date: string; status: string; cnt: number }
  const rows = await db.getAllAsync<Row>(
    `SELECT occurrence_date AS date, status, COUNT(*) AS cnt
     FROM task_completions
     WHERE occurrence_date >= ? AND occurrence_date <= ?
     GROUP BY occurrence_date, status ORDER BY occurrence_date ASC`,
    [isoDate(start), isoDate(end)]
  )

  const dayMap = new Map<string, HeatmapDay>()
  for (const r of rows) {
    if (!dayMap.has(r.date))
      dayMap.set(r.date, { date: r.date, completed: 0, skipped: 0, deferred: 0, total: 0 })
    const d = dayMap.get(r.date)!
    if (r.status === 'completed')      d.completed += r.cnt
    else if (r.status === 'skipped')   d.skipped   += r.cnt
    else if (r.status === 'deferred')  d.deferred  += r.cnt
    d.total += r.cnt
  }

  return [...dayMap.values()]
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportTasks(db: SQLite.SQLiteDatabase): Promise<ExportRow[]> {
  interface TaskExRow {
    task_id: number
    title: string
    description: string | null
    category: string
    priority: string
    due_date: string | null
    recurrence_type: string | null
    status: string
    created_at: string
  }

  const tasks = await db.getAllAsync<TaskExRow>(
    `SELECT t.id AS task_id, t.title, t.description,
       COALESCE(c.name,'Uncategorized') AS category,
       t.priority, t.due_date, r.type AS recurrence_type, t.status, t.created_at
     FROM tasks t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN recurrences r ON t.recurrence_id = r.id
     ORDER BY t.id ASC`
  )

  const result: ExportRow[] = []
  for (const t of tasks) {
    const tagRows = await db.getAllAsync<{ name: string }>(
      `SELECT tg.name FROM tags tg JOIN task_tags tt ON tt.tag_id = tg.id WHERE tt.task_id = ?`,
      [t.task_id]
    )
    result.push({ ...t, tags: tagRows.map(r => r.name).join(', ') })
  }
  return result
}

export async function exportCompletions(
  db: SQLite.SQLiteDatabase
): Promise<CompletionExportRow[]> {
  return db.getAllAsync<CompletionExportRow>(
    `SELECT tc.task_id, t.title AS task_title,
       tc.occurrence_date, tc.status, tc.deferred_to, tc.completed_at, tc.notes
     FROM task_completions tc JOIN tasks t ON tc.task_id = t.id
     ORDER BY tc.occurrence_date DESC, tc.task_id ASC`
  )
}
