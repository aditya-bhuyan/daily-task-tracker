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
  days_of_week: string | null   // JSON array string e.g. "[1,3,5]"
  day_of_month: number | null
  month_of_year: number | null
  custom_cron: string | null
  ends_on: string | null        // ISO date
  ends_after: number | null
}

export interface Task {
  id: number
  title: string
  description: string | null
  category_id: number | null
  priority: 'low' | 'medium' | 'high'
  due_date: string | null       // ISO date string
  due_time: string | null       // HH:MM
  recurrence_id: number | null
  schedule_type: 'any' | 'weekday' | 'weekend'
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: number
  task_id: number
  occurrence_date: string       // ISO date — which day this applies to
  status: 'completed' | 'skipped' | 'deferred'
  deferred_to: string | null    // ISO date
  completed_at: string | null   // ISO timestamp
  notes: string | null
}

// Joined type for UI consumption
export interface TaskWithDetails extends Task {
  category?: Category
  recurrence?: Recurrence
  completion_today?: TaskCompletion  // completion record for today, if any
}
