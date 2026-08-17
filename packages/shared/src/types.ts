// @taskflow/shared — canonical type definitions shared by desktop and mobile.
// The desktop renderer imports these via src/types/api.d.ts (kept separate
// to satisfy electron-vite's split tsconfig requirement). The mobile app
// imports directly from this package.

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  sort_order: number
}

// ─── Recurrence ───────────────────────────────────────────────────────────────

export interface Recurrence {
  id: number
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'hourly' | 'custom'
  interval: number
  /** JSON array string, e.g. "[1,3,5]" */
  days_of_week: string | null
  day_of_month: number | null
  month_of_year: number | null
  custom_cron: string | null
  /** ISO date */
  ends_on: string | null
  ends_after: number | null
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: number
  name: string
  color: string
}

// ─── Subtask ──────────────────────────────────────────────────────────────────

export interface Subtask {
  id: number
  task_id: number
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: number
  title: string
  description: string | null
  category_id: number | null
  priority: 'low' | 'medium' | 'high'
  /** ISO date string */
  due_date: string | null
  /** HH:MM */
  due_time: string | null
  recurrence_id: number | null
  schedule_type: 'any' | 'weekday' | 'weekend'
  status: 'active' | 'archived'
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── TaskCompletion ───────────────────────────────────────────────────────────

export interface TaskCompletion {
  id: number
  task_id: number
  /** ISO date — which day this applies to */
  occurrence_date: string
  status: 'completed' | 'skipped' | 'deferred'
  /** ISO date */
  deferred_to: string | null
  /** ISO timestamp */
  completed_at: string | null
  notes: string | null
}

// ─── TaskWithDetails ──────────────────────────────────────────────────────────

export interface TaskWithDetails extends Task {
  category?: Category
  recurrence?: Recurrence
  /** completion record for today, if any */
  completion_today?: TaskCompletion
  tags?: Tag[]
  subtasks?: Subtask[]
}

// ─── Analytics ────────────────────────────────────────────────────────────────

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

export interface WeeklyStats {
  week_start: string
  week_end: string
  total_scheduled: number
  completed: number
  skipped: number
  deferred: number
  completion_rate: number
  by_category: CategoryStat[]
  by_priority: PriorityStat[]
  top_streaks: StreakEntry[]
}

export interface HeatmapDay {
  date: string
  completed: number
  skipped: number
  deferred: number
  total: number
}

// ─── Export types ─────────────────────────────────────────────────────────────

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

// ─── Input types ──────────────────────────────────────────────────────────────

export type TaskFilters = {
  category_id?: number
  status?: string
  search?: string
  priority?: string
  schedule_type?: string
}

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
  recurrence?: Omit<Recurrence, 'id'>
}

export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>> & {
  recurrence?: Omit<Recurrence, 'id'> | null
}
