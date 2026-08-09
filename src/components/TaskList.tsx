import { TaskCard } from '@/components/TaskCard'
import type { TaskWithDetails } from '@/types'

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskList
// ---------------------------------------------------------------------------

interface TaskListProps {
  tasks: TaskWithDetails[]
  isLoading: boolean
  todayDate?: string // if provided, each card shows completion actions
  onTaskChange?: () => void
}

export function TaskList({ tasks, isLoading, todayDate, onTaskChange }: TaskListProps) {
  if (isLoading) return <TaskSkeleton />

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-3 text-base font-medium">No tasks here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All clear! Add a task to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          todayDate={todayDate}
          onTaskChange={onTaskChange ?? (() => {})}
        />
      ))}
    </div>
  )
}
