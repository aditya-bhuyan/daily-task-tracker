import { useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import type { TaskWithDetails } from '@/types'

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskList — Feature 7: drag-and-drop reordering
// ---------------------------------------------------------------------------

interface TaskListProps {
  tasks: TaskWithDetails[]
  isLoading: boolean
  todayDate?: string
  onTaskChange?: () => void
  /** If true, enables HTML5 drag-and-drop reordering (persisted via IPC) */
  draggable?: boolean
}

export function TaskList({ tasks, isLoading, todayDate, onTaskChange, draggable = false }: TaskListProps) {
  const [localOrder, setLocalOrder] = useState<number[] | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId]   = useState<number | null>(null)

  if (isLoading) return <TaskSkeleton />

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-3 text-base font-medium">No tasks here</p>
        <p className="mt-1 text-sm text-muted-foreground">All clear! Add a task to get started.</p>
      </div>
    )
  }

  // Derive display order: localOrder (during drag) or natural task order
  const orderedTasks = localOrder
    ? localOrder.map(id => tasks.find(t => t.id === id)!).filter(Boolean)
    : tasks

  function handleDragStart(id: number) {
    setDragId(id)
    setLocalOrder(orderedTasks.map(t => t.id))
  }

  function handleDragOver(e: React.DragEvent, overId: number) {
    e.preventDefault()
    if (dragId === null || dragId === overId) return
    setOverId(overId)
    setLocalOrder(prev => {
      const ids = prev ?? orderedTasks.map(t => t.id)
      const from = ids.indexOf(dragId)
      const to   = ids.indexOf(overId)
      if (from === -1 || to === -1) return prev
      const next = [...ids]
      next.splice(from, 1)
      next.splice(to, 0, dragId)
      return next
    })
  }

  async function handleDrop() {
    if (localOrder && window.taskApi) {
      await window.taskApi.tasks.reorder(localOrder).catch(() => {})
    }
    setDragId(null)
    setOverId(null)
    onTaskChange?.()
  }

  return (
    <div className="flex flex-col gap-2">
      {orderedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          todayDate={todayDate}
          onTaskChange={onTaskChange ?? (() => {})}
          onDragStart={draggable ? handleDragStart : undefined}
          onDragOver={draggable ? handleDragOver : undefined}
          onDrop={draggable ? handleDrop : undefined}
          isDragOver={draggable && overId === task.id}
        />
      ))}
    </div>
  )
}
