// Self-contained type declarations for window.taskApi exposed via contextBridge.
// These mirror the types in electron/db/types.ts — kept separate to avoid
// cross-project imports between the renderer (tsconfig.web.json) and the
// main-process TypeScript project (tsconfig.node.json).

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  sort_order: number
}

export interface Recurrence {
  id: number
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'hourly' | 'custom'
  interval: number
  days_of_week: string | null
  day_of_month: number | null
  month_of_year: number | null
  custom_cron: string | null
  ends_on: string | null
  ends_after: number | null
}

export interface Task {
  id: number
  title: string
  description: string | null
  category_id: number | null
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  due_time: string | null
  recurrence_id: number | null
  schedule_type: 'any' | 'weekday' | 'weekend'
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: number
  task_id: number
  occurrence_date: string
  status: 'completed' | 'skipped' | 'deferred'
  deferred_to: string | null
  completed_at: string | null
  notes: string | null
}

export interface TaskWithDetails extends Task {
  category?: Category
  recurrence?: Recurrence
  completion_today?: TaskCompletion
}

type TaskFilters = {
  category_id?: number
  status?: string
  search?: string
  priority?: string
  schedule_type?: string
}

type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
  recurrence?: Omit<Recurrence, 'id'>
}

type UpdateTaskInput = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>> & {
  recurrence?: Omit<Recurrence, 'id'> | null
}

export interface TaskApi {
  tasks: {
    getAll(filters?: TaskFilters): Promise<TaskWithDetails[]>
    getById(id: number): Promise<TaskWithDetails | undefined>
    getToday(): Promise<TaskWithDetails[]>
    getByDate(date: string): Promise<TaskWithDetails[]>
    create(data: CreateTaskInput): Promise<TaskWithDetails>
    update(id: number, data: UpdateTaskInput): Promise<TaskWithDetails | undefined>
    delete(id: number): Promise<boolean>
    archive(id: number): Promise<boolean>
  }
  categories: {
    getAll(): Promise<Category[]>
    create(data: Omit<Category, 'id'>): Promise<Category>
    update(id: number, data: Partial<Omit<Category, 'id'>>): Promise<Category | undefined>
    delete(id: number): Promise<boolean>
    reorder(ids: number[]): Promise<void>
  }
  completions: {
    markComplete(task_id: number, occurrence_date: string, notes?: string): Promise<TaskCompletion>
    markDeferred(task_id: number, occurrence_date: string, deferred_to: string): Promise<TaskCompletion>
    markSkipped(task_id: number, occurrence_date: string): Promise<TaskCompletion>
    getForDate(date: string): Promise<TaskCompletion[]>
    getHistory(task_id: number, limit?: number): Promise<TaskCompletion[]>
    getStreak(task_id: number): Promise<number>
    deleteForDate(task_id: number, occurrence_date: string): Promise<boolean>
  }
  app: {
    getVersion(): Promise<string>
    openDataFolder(): Promise<void>
    updateTrayCount(count: number): Promise<void>
    snoozeTask(taskId: number, minutes: number): Promise<boolean>
  }
  calendar: {
    getOccurrencesForMonth(year: number, month: number): Promise<Record<string, number>>
  }
}

declare global {
  interface Window {
    taskApi: TaskApi
  }
}
