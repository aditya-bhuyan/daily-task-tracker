import { useEffect, useState } from 'react'
import { TaskList } from '@/components/TaskList'
import { useApp } from '@/context/AppContext'
import type { TaskWithDetails } from '@/types'

export function TodayView() {
  const { todayDate, refreshTrigger, triggerRefresh } = useApp()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    window.taskApi.tasks.getToday().then((result) => {
      if (!cancelled) {
        setTasks(result)
        setIsLoading(false)
        // Update tray tooltip with incomplete count
        const incomplete = result.filter(
          (t) => t.completion_today?.status !== 'completed'
        ).length
        window.taskApi.app.updateTrayCount(incomplete).catch(() => {/* ignore */})
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [todayDate, refreshTrigger])

  const completed = tasks.filter((t) => t.completion_today?.status === 'completed').length

  return (
    <div className="space-y-4">
      {/* Summary line */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} today
          {tasks.length > 0 && `, ${completed} completed`}
        </p>
      )}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        todayDate={todayDate}
        onTaskChange={triggerRefresh}
        draggable
      />
    </div>
  )
}
