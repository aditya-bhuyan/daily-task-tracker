import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { snoozeBrowserTask } from '@/lib/browserNotifications'
import type { TaskWithDetails } from '@/types'

const IS_ELECTRON = typeof window !== 'undefined' && 'electron' in window

async function snoozeTask(taskId: number, minutes: number) {
  if (IS_ELECTRON) {
    await window.taskApi.app.snoozeTask(taskId, minutes)
  } else {
    // Browser: schedule via the in-memory scheduler
    const task = await window.taskApi.tasks.getById(taskId)
    if (task) snoozeBrowserTask(task, minutes)
  }
}

export interface CompletionActionsProps {
  task: TaskWithDetails
  todayDate: string
  onActionComplete: () => void
}

export function CompletionActions({ task, todayDate, onActionComplete }: CompletionActionsProps) {
  const [deferDate, setDeferDate] = useState('')
  const [deferOpen, setDeferOpen] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const completion = task.completion_today

  // ── Helpers ────────────────────────────────────────────────────────────────

  function tomorrowDate(): string {
    const d = new Date(todayDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  async function run(fn: () => Promise<unknown>) {
    if (loading) return
    setLoading(true)
    try {
      await fn()
      onActionComplete()
    } catch {
      // silent — could add toast in future
    } finally {
      setLoading(false)
    }
  }

  // ── Undo helper ────────────────────────────────────────────────────────────

  function handleUndo() {
    run(() => window.taskApi.completions.deleteForDate(task.id, todayDate))
  }

  // ── Already actioned — show status badge ──────────────────────────────────

  if (completion) {
    if (completion.status === 'completed') {
      return (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            ✓ Done
          </span>
        </div>
      )
    }
    if (completion.status === 'deferred') {
      return (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            ⏭ Deferred to {completion.deferred_to}
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      )
    }
    if (completion.status === 'skipped') {
      return (
        <div className="flex items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            ⏭ Skipped
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      )
    }
  }

  // ── Action buttons ─────────────────────────────────────────────────────────

  async function handleDone() {
    await run(async () => {
      await window.taskApi.completions.markComplete(task.id, todayDate)
      // Archive non-recurring tasks after completion
      if (!task.recurrence_id) {
        await window.taskApi.tasks.archive(task.id)
      }
    })
  }

  function handleTomorrow() {
    run(() => window.taskApi.completions.markDeferred(task.id, todayDate, tomorrowDate()))
  }

  async function handlePickDay() {
    if (!deferDate) return
    setDeferOpen(false)
    await run(() => window.taskApi.completions.markDeferred(task.id, todayDate, deferDate))
  }

  function handleSkip() {
    run(() => window.taskApi.completions.markSkipped(task.id, todayDate))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {/* Done */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20 text-xs px-2"
        disabled={loading}
        onClick={handleDone}
      >
        ✅ Done
      </Button>

      {/* Tomorrow */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 text-xs px-2"
        disabled={loading}
        onClick={handleTomorrow}
      >
        ⏭ Tomorrow
      </Button>

      {/* Pick Day */}
      <Popover open={deferOpen} onOpenChange={setDeferOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            disabled={loading}
          >
            📅 Pick Day
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Defer to:</p>
            <input
              type="date"
              min={tomorrowDate()}
              value={deferDate}
              onChange={(e) => setDeferDate(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={handlePickDay} disabled={!deferDate}>
              Defer
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Skip */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs px-2 text-muted-foreground"
        disabled={loading}
        onClick={handleSkip}
      >
        ⏭ Skip
      </Button>

      {/* Snooze */}
      <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-muted-foreground"
            disabled={loading}
          >
            💤 Snooze
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">Snooze reminder for:</p>
          <div className="flex flex-col gap-1">
            {[5, 10, 30, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                className="rounded px-3 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => { setSnoozeOpen(false); snoozeTask(task.id, mins) }}
              >
                {mins < 60 ? `${mins} minutes` : '1 hour'}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
