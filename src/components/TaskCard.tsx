import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CompletionActions } from '@/components/CompletionActions'
import { TaskModal } from '@/components/TaskModal'
import { SubtaskList } from '@/components/SubtaskList'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import type { TaskWithDetails } from '@/types'

// ---------------------------------------------------------------------------
// Priority styles
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

// ---------------------------------------------------------------------------
// 3-dot dropdown menu
// ---------------------------------------------------------------------------

interface DotMenuProps {
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  onSkipToday?: () => void
  onMoveToTomorrow?: () => void
  onToggleSubtasks: () => void
  showingSubtasks: boolean
}

function DotMenu({ onEdit, onArchive, onDelete, onSkipToday, onMoveToTomorrow, onToggleSubtasks, showingSubtasks }: DotMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus:opacity-100"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        aria-label="Task options"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[180px] rounded-md border bg-popover py-1 shadow-md">
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setOpen(false); onEdit() }}>
            ✏️ Edit
          </button>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setOpen(false); onToggleSubtasks() }}>
            {showingSubtasks ? '🔼 Hide Sub-tasks' : '🔽 Show Sub-tasks'}
          </button>
          {onMoveToTomorrow && (
            <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setOpen(false); onMoveToTomorrow() }}>
              ⏭ Move to Tomorrow
            </button>
          )}
          {onSkipToday && (
            <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setOpen(false); onSkipToday() }}>
              ⏩ Skip Today Only
            </button>
          )}
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setOpen(false); onArchive() }}>
            📦 Archive
          </button>
          <div className="my-1 border-t border-border" />
          <button type="button" className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10" onClick={() => { setOpen(false); onDelete() }}>
            🗑 {onSkipToday ? 'Delete All Occurrences' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  open,
  taskTitle,
  isRecurring,
  onConfirm,
  onCancel,
}: {
  open: boolean
  taskTitle: string
  isRecurring: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Task?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;<span className="font-medium text-foreground">{taskTitle}</span>&rdquo; will be permanently
          deleted{isRecurring ? ' along with all future occurrences and' : ' along with'} its completion history. This cannot be undone.
        </p>
        {isRecurring && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
            💡 To remove it for today only, use <strong>Skip Today Only</strong> from the menu instead.
          </p>
        )}
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// TaskCard — Feature 7: drag-and-drop handle
// ---------------------------------------------------------------------------

export interface TaskCardProps {
  task: TaskWithDetails
  todayDate?: string
  onTaskChange: () => void
  /** drag-and-drop callbacks (Feature 7) */
  onDragStart?: (id: number) => void
  onDragOver?: (e: React.DragEvent, id: number) => void
  onDrop?: () => void
  isDragOver?: boolean
}

export function TaskCard({ task, todayDate, onTaskChange, onDragStart, onDragOver, onDrop, isDragOver }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [streak, setStreak] = useState<number>(0)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const isRecurring = !!task.recurrence_id

  useEffect(() => {
    if (!isRecurring) return
    if (typeof window === 'undefined' || !window.taskApi) return
    window.taskApi.completions.getStreak(task.id).then(setStreak).catch(() => {})
  }, [task.id, isRecurring])

  async function handleArchive() {
    try { await window.taskApi.tasks.archive(task.id); onTaskChange() } catch { /* silent */ }
  }

  async function handleDelete() {
    try { await window.taskApi.tasks.delete(task.id); onTaskChange() } catch { /* silent */ }
  }

  function tomorrowDate(): string {
    const d = new Date((todayDate ?? new Date().toISOString().slice(0, 10)) + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  async function handleSkipToday() {
    if (!todayDate || typeof window === 'undefined' || !window.taskApi) return
    try { await window.taskApi.completions.markSkipped(task.id, todayDate); onTaskChange() } catch { /* silent */ }
  }

  async function handleMoveToTomorrow() {
    if (!todayDate || typeof window === 'undefined' || !window.taskApi) return
    try { await window.taskApi.completions.markDeferred(task.id, todayDate, tomorrowDate()); onTaskChange() } catch { /* silent */ }
  }

  const priorityClass = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium
  const isCompleted = task.completion_today?.status === 'completed'

  // Subtask progress badge
  const subtaskCount = task.subtasks?.length ?? 0
  const subtaskDone  = task.subtasks?.filter(s => s.completed).length ?? 0

  return (
    <>
      <Card
        draggable={!!onDragStart}
        onDragStart={() => onDragStart?.(task.id)}
        onDragOver={(e) => onDragOver?.(e, task.id)}
        onDrop={onDrop}
        onDragEnd={() => {/* cleanup handled by parent */}}
        className={`group relative transition-shadow hover:shadow-sm ${isCompleted ? 'opacity-60' : ''} ${isDragOver ? 'ring-2 ring-primary' : ''} ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <CardContent className="flex flex-col gap-1 px-4 py-3">
          {/* Row 1: drag handle + title + controls */}
          <div className="flex items-start justify-between gap-2">
            {onDragStart && (
              <span className="mt-0.5 shrink-0 cursor-grab text-muted-foreground opacity-30 select-none text-xs">⠿</span>
            )}
            <button
              type="button"
              className="flex-1 text-left text-sm font-medium leading-snug hover:underline"
              onClick={() => setEditOpen(true)}
            >
              {isCompleted ? (
                <span className="line-through text-muted-foreground">{task.title}</span>
              ) : task.title}
            </button>

            {/* Pomodoro timer popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus:opacity-100 text-sm"
                  aria-label="Pomodoro timer"
                  title="Pomodoro timer"
                >
                  🍅
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <PomodoroTimer taskTitle={task.title} onComplete={onTaskChange} />
              </PopoverContent>
            </Popover>

            <DotMenu
              onEdit={() => setEditOpen(true)}
              onArchive={handleArchive}
              onDelete={() => setDeleteOpen(true)}
              onSkipToday={isRecurring ? handleSkipToday : undefined}
              onMoveToTomorrow={todayDate ? handleMoveToTomorrow : undefined}
              onToggleSubtasks={() => setShowSubtasks(s => !s)}
              showingSubtasks={showSubtasks}
            />
          </div>

          {/* Row 2: badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {task.category && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: task.category.color }}
              >
                {task.category.icon} {task.category.name}
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass}`}>
              {task.priority}
            </span>
            {task.schedule_type !== 'any' && (
              <Badge variant="outline" className="text-xs">
                {task.schedule_type === 'weekday' ? '📅 Weekdays' : '🎉 Weekends'}
              </Badge>
            )}
            {task.due_time && (
              <Badge variant="outline" className="text-xs">🕐 {task.due_time}</Badge>
            )}
            {task.due_date && (
              <Badge variant="outline" className="text-xs">📆 {task.due_date}</Badge>
            )}
            {task.recurrence && (
              <Badge variant="outline" className="text-xs">🔁 {task.recurrence.type}</Badge>
            )}
            {/* Tags — Feature 4 */}
            {(task.tags ?? []).map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                🏷 {tag.name}
              </span>
            ))}
            {/* Subtask progress badge */}
            {subtaskCount > 0 && (
              <Badge
                variant="outline"
                className={`text-xs cursor-pointer ${subtaskDone === subtaskCount ? 'text-green-600 border-green-400' : ''}`}
                onClick={() => setShowSubtasks(s => !s)}
              >
                ☑ {subtaskDone}/{subtaskCount}
              </Badge>
            )}
          </div>

          {/* Completion actions */}
          {todayDate && (
            <CompletionActions task={task} todayDate={todayDate} onActionComplete={onTaskChange} />
          )}

          {/* Streak indicator */}
          {streak >= 2 && (
            <p className="mt-0.5 text-xs text-orange-500 dark:text-orange-400">🔥 {streak} day streak</p>
          )}

          {/* Sub-task checklist — Feature 3 */}
          {showSubtasks && <SubtaskList taskId={task.id} />}
        </CardContent>
      </Card>

      <TaskModal
        open={editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); onTaskChange() }}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        taskTitle={task.title}
        isRecurring={isRecurring}
        onConfirm={() => { setDeleteOpen(false); handleDelete() }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
