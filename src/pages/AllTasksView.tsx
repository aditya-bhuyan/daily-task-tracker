import { useEffect, useState } from 'react'
import { TaskList } from '@/components/TaskList'
import { FilterBar, DEFAULT_FILTERS } from '@/components/FilterBar'
import type { FilterState } from '@/components/FilterBar'
import { useApp } from '@/context/AppContext'
import type { TaskWithDetails } from '@/types'

export function AllTasksView() {
  const { refreshTrigger, triggerRefresh } = useApp()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    window.taskApi.tasks.getAll({
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
  }, [refreshTrigger, filters])

  return (
    <div className="space-y-4">
      <FilterBar value={filters} onChange={setFilters} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onTaskChange={triggerRefresh}
      />
    </div>
  )
}
