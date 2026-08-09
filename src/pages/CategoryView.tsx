import { useEffect, useState } from 'react'
import { TaskList } from '@/components/TaskList'
import { FilterBar, DEFAULT_FILTERS } from '@/components/FilterBar'
import type { FilterState } from '@/components/FilterBar'
import { useApp } from '@/context/AppContext'
import type { TaskWithDetails } from '@/types'

interface CategoryViewProps {
  categoryId: number
}

export function CategoryView({ categoryId }: CategoryViewProps) {
  const { categories, refreshTrigger, triggerRefresh } = useApp()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const category = categories.find((c) => c.id === categoryId)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setTasks([])

    window.taskApi.tasks.getAll({
      category_id: categoryId,
      search: filters.search || undefined,
      priority: filters.priority !== 'all' ? filters.priority : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      schedule_type: filters.schedule_type !== 'all' ? filters.schedule_type : undefined,
    }).then((result) => {
      if (!cancelled) {
        setTasks(result)
        setIsLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [categoryId, refreshTrigger, filters])

  // Reset filters when switching categories
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [categoryId])

  return (
    <div className="space-y-4">
      {category && (
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <h2 className="text-sm font-medium text-muted-foreground">
            {category.icon} {category.name}
          </h2>
        </div>
      )}
      <FilterBar value={filters} onChange={setFilters} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onTaskChange={triggerRefresh}
      />
    </div>
  )
}
