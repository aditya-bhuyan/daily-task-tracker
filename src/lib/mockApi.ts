/**
 * Mock implementation of window.taskApi for browser mode (no Electron IPC).
 * Provides in-memory storage so the full UI is usable in a plain browser.
 */

import type {
  Category,
  Task,
  TaskWithDetails,
  TaskCompletion,
  Recurrence,
} from '@/types'

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CATEGORIES: Category[] = [
  { id: 1, name: 'Office / Professional', icon: '💼', color: '#3b82f6', sort_order: 1 },
  { id: 2, name: 'Health & Fitness',      icon: '🏃', color: '#22c55e', sort_order: 2 },
  { id: 3, name: 'Finance',               icon: '💰', color: '#f59e0b', sort_order: 3 },
  { id: 4, name: 'Study / Academics',     icon: '📚', color: '#8b5cf6', sort_order: 4 },
  { id: 5, name: 'Spiritual / Mindfulness', icon: '🧘', color: '#ec4899', sort_order: 5 },
  { id: 6, name: 'Daily Personal Tasks',  icon: '🏠', color: '#06b6d4', sort_order: 6 },
  { id: 7, name: 'Daily Health Tasks',    icon: '💊', color: '#f97316', sort_order: 7 },
  { id: 8, name: 'Weekday Tasks',         icon: '📅', color: '#64748b', sort_order: 8 },
  { id: 9, name: 'Weekend Tasks',         icon: '🎉', color: '#a855f7', sort_order: 9 },
]

const todayStr = new Date().toISOString().slice(0, 10)

const SEED_TASKS: TaskWithDetails[] = [
  {
    id: 1,
    title: 'Morning standup',
    description: 'Daily team sync',
    category_id: 1,
    priority: 'high',
    due_date: todayStr,
    due_time: '09:00',
    recurrence_id: 1,
    schedule_type: 'weekday',
    status: 'active',
    created_at: todayStr,
    updated_at: todayStr,
    category: SEED_CATEGORIES[0],
    recurrence: { id: 1, type: 'daily', interval: 1, days_of_week: null, day_of_month: null, month_of_year: null, custom_cron: null, ends_on: null, ends_after: null },
  },
  {
    id: 2,
    title: '30 min walk',
    description: null,
    category_id: 2,
    priority: 'medium',
    due_date: todayStr,
    due_time: '07:00',
    recurrence_id: null,
    schedule_type: 'any',
    status: 'active',
    created_at: todayStr,
    updated_at: todayStr,
    category: SEED_CATEGORIES[1],
  },
  {
    id: 3,
    title: 'Review monthly budget',
    description: null,
    category_id: 3,
    priority: 'medium',
    due_date: todayStr,
    due_time: null,
    recurrence_id: null,
    schedule_type: 'any',
    status: 'active',
    created_at: todayStr,
    updated_at: todayStr,
    category: SEED_CATEGORIES[2],
  },
]

// ─── In-memory store ──────────────────────────────────────────────────────────

let _categories: Category[] = [...SEED_CATEGORIES]
let _tasks: TaskWithDetails[] = [...SEED_TASKS]
let _completions: TaskCompletion[] = []
let _nextTaskId = 100
let _nextCatId = 20
let _nextCompId = 1

function delay<T>(val: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(val), 50))
}

function withCategory(task: Task): TaskWithDetails {
  return {
    ...task,
    category: _categories.find((c) => c.id === task.category_id),
    completion_today: _completions.find(
      (c) => c.task_id === task.id && c.occurrence_date === todayStr
    ),
  }
}

// ─── Mock API ─────────────────────────────────────────────────────────────────

export const mockTaskApi = {
  tasks: {
    getAll: async (filters?: {
      category_id?: number
      status?: string
      search?: string
      priority?: string
      schedule_type?: string
    }) => {
      let result = _tasks
      if (filters?.category_id) result = result.filter((t) => t.category_id === filters.category_id)
      if (filters?.status && filters.status !== 'all') result = result.filter((t) => t.status === filters.status)
      if (!filters?.status) result = result.filter((t) => t.status === 'active')
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
      }
      if (filters?.priority && filters.priority !== 'all') result = result.filter((t) => t.priority === filters.priority)
      if (filters?.schedule_type && filters.schedule_type !== 'all') result = result.filter((t) => t.schedule_type === filters.schedule_type)
      return delay(result.map(withCategory))
    },
    getById: async (id: number) => delay(_tasks.find((t) => t.id === id)),
    getToday: async () => delay(_tasks.filter((t) => t.status === 'active' && (t.due_date === todayStr || t.recurrence_id)).map(withCategory)),
    getByDate: async (date: string) => delay(_tasks.filter((t) => t.status === 'active' && t.due_date === date).map(withCategory)),
    create: async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { recurrence?: Omit<Recurrence, 'id'> }) => {
      const { recurrence, ...taskData } = data as typeof data & { recurrence?: Omit<Recurrence, 'id'> }
      let recurrence_id: number | null = null
      let recurrenceObj: Recurrence | undefined
      if (recurrence) {
        recurrence_id = Date.now()
        recurrenceObj = { id: recurrence_id, ...recurrence }
      }
      const task: TaskWithDetails = {
        ...taskData,
        id: _nextTaskId++,
        recurrence_id,
        created_at: todayStr,
        updated_at: todayStr,
        category: _categories.find((c) => c.id === taskData.category_id),
        recurrence: recurrenceObj,
      }
      _tasks.push(task)
      return delay(task)
    },
    update: async (id: number, data: Partial<Task> & { recurrence?: Omit<Recurrence, 'id'> | null }) => {
      const idx = _tasks.findIndex((t) => t.id === id)
      if (idx === -1) return delay(undefined)
      const { recurrence, ...taskData } = data as typeof data & { recurrence?: Omit<Recurrence, 'id'> | null }
      const updated = { ..._tasks[idx], ...taskData, updated_at: todayStr }
      if (recurrence !== undefined) {
        if (recurrence === null) {
          updated.recurrence_id = null
          updated.recurrence = undefined
        } else {
          const rid = updated.recurrence_id ?? Date.now()
          updated.recurrence_id = rid
          updated.recurrence = { id: rid, ...recurrence }
        }
      }
      updated.category = _categories.find((c) => c.id === updated.category_id)
      _tasks[idx] = updated
      return delay(updated as TaskWithDetails)
    },
    delete: async (id: number) => {
      _tasks = _tasks.filter((t) => t.id !== id)
      _completions = _completions.filter((c) => c.task_id !== id)
      return delay(true)
    },
    archive: async (id: number) => {
      const t = _tasks.find((t) => t.id === id)
      if (t) { t.status = 'archived'; t.updated_at = todayStr }
      return delay(true)
    },
  },

  categories: {
    getAll: async () => delay([..._categories]),
    create: async (data: Omit<Category, 'id'>) => {
      const cat: Category = { id: _nextCatId++, ...data }
      _categories.push(cat)
      return delay(cat)
    },
    update: async (id: number, data: Partial<Omit<Category, 'id'>>) => {
      const idx = _categories.findIndex((c) => c.id === id)
      if (idx === -1) return delay(undefined)
      _categories[idx] = { ..._categories[idx], ...data }
      return delay(_categories[idx])
    },
    delete: async (id: number) => {
      _categories = _categories.filter((c) => c.id !== id)
      return delay(true)
    },
    reorder: async (ids: number[]) => {
      ids.forEach((id, i) => {
        const c = _categories.find((c) => c.id === id)
        if (c) c.sort_order = i + 1
      })
      return delay(undefined)
    },
  },

  completions: {
    markComplete: async (task_id: number, occurrence_date: string, notes?: string) => {
      const existing = _completions.findIndex((c) => c.task_id === task_id && c.occurrence_date === occurrence_date)
      const rec: TaskCompletion = { id: existing >= 0 ? _completions[existing].id : _nextCompId++, task_id, occurrence_date, status: 'completed', deferred_to: null, completed_at: new Date().toISOString(), notes: notes ?? null }
      if (existing >= 0) _completions[existing] = rec; else _completions.push(rec)
      return delay(rec)
    },
    markDeferred: async (task_id: number, occurrence_date: string, deferred_to: string) => {
      const existing = _completions.findIndex((c) => c.task_id === task_id && c.occurrence_date === occurrence_date)
      const rec: TaskCompletion = { id: existing >= 0 ? _completions[existing].id : _nextCompId++, task_id, occurrence_date, status: 'deferred', deferred_to, completed_at: null, notes: null }
      if (existing >= 0) _completions[existing] = rec; else _completions.push(rec)
      return delay(rec)
    },
    markSkipped: async (task_id: number, occurrence_date: string) => {
      const existing = _completions.findIndex((c) => c.task_id === task_id && c.occurrence_date === occurrence_date)
      const rec: TaskCompletion = { id: existing >= 0 ? _completions[existing].id : _nextCompId++, task_id, occurrence_date, status: 'skipped', deferred_to: null, completed_at: null, notes: null }
      if (existing >= 0) _completions[existing] = rec; else _completions.push(rec)
      return delay(rec)
    },
    getForDate: async (date: string) => delay(_completions.filter((c) => c.occurrence_date === date)),
    getHistory: async (task_id: number, limit = 30) => delay(_completions.filter((c) => c.task_id === task_id).slice(-limit)),
    getStreak: async (_task_id: number) => delay(0),
    deleteForDate: async (task_id: number, occurrence_date: string) => {
      _completions = _completions.filter((c) => !(c.task_id === task_id && c.occurrence_date === occurrence_date))
      return delay(true)
    },
  },

  app: {
    getVersion: async () => delay('0.1.0 (browser)'),
    openDataFolder: async () => delay(undefined),
    updateTrayCount: async (_count: number) => delay(undefined),
    snoozeTask: async (_taskId: number, _minutes: number) => delay(true),
  },

  calendar: {
    getOccurrencesForMonth: async (year: number, month: number) => {
      const counts: Record<string, number> = {}
      _tasks.filter((t) => t.status === 'active').forEach((t) => {
        if (t.due_date) {
          const d = new Date(t.due_date + 'T00:00:00')
          if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            counts[t.due_date] = (counts[t.due_date] ?? 0) + 1
          }
        }
      })
      return delay(counts)
    },
  },
} as unknown as Window['taskApi']
