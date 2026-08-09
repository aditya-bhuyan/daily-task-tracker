import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/TaskList'
import { useApp } from '@/context/AppContext'
import type { TaskWithDetails } from '@/types'

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

// ────────────────────────────────────────────────────────────────────────────
// CalendarView
// ────────────────────────────────────────────────────────────────────────────

export function CalendarView() {
  const { todayDate, triggerRefresh } = useApp()
  const today = new Date(todayDate + 'T00:00:00')

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1) // 1-based
  const [selectedDay, setSelectedDay] = useState<string | null>(todayDate)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [selectedTasks, setSelectedTasks] = useState<TaskWithDetails[]>([])
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)

  // Load task counts for the visible month
  useEffect(() => {
    if (typeof window === 'undefined' || !window.taskApi) return
    let cancelled = false
    setLoadingCounts(true)
    window.taskApi.calendar.getOccurrencesForMonth(viewYear, viewMonth)
      .then((counts) => {
        if (!cancelled) {
          setTaskCounts(counts)
          setLoadingCounts(false)
        }
      })
      .catch(() => { if (!cancelled) setLoadingCounts(false) })
    return () => { cancelled = true }
  }, [viewYear, viewMonth])

  // Load tasks for selected day
  useEffect(() => {
    if (!selectedDay || typeof window === 'undefined' || !window.taskApi) return
    let cancelled = false
    setLoadingDay(true)
    window.taskApi.tasks.getByDate(selectedDay)
      .then((tasks) => {
        if (!cancelled) {
          setSelectedTasks(tasks)
          setLoadingDay(false)
        }
      })
      .catch(() => { if (!cancelled) setLoadingDay(false) })
    return () => { cancelled = true }
  }, [selectedDay])

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)

  // Build grid: leading empty cells + day cells
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevMonth}>← Prev</Button>
        <h2 className="text-base font-semibold">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
          {loadingCounts && <span className="ml-2 text-xs text-muted-foreground">Loading…</span>}
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>Next →</Button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-background min-h-[52px]" />
          }

          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayDate
          const isSelected = dateStr === selectedDay
          const count = taskCounts[dateStr] ?? 0

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDay(dateStr)}
              className={[
                'bg-background min-h-[52px] flex flex-col items-center justify-start pt-1.5 pb-1 px-1',
                'hover:bg-muted/50 transition-colors',
                isSelected ? 'ring-2 ring-inset ring-primary' : '',
                isToday ? 'font-bold' : '',
              ].filter(Boolean).join(' ')}
            >
              <span
                className={[
                  'text-sm w-6 h-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-primary text-primary-foreground' : '',
                ].filter(Boolean).join(' ')}
              >
                {day}
              </span>
              {count > 0 && (
                <span className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] px-1.5 min-w-[18px]">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day task list */}
      {selectedDay && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Tasks for{' '}
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <TaskList
            tasks={selectedTasks}
            isLoading={loadingDay}
            todayDate={todayDate}
            onTaskChange={() => {
              triggerRefresh()
              // Re-fetch counts and day tasks after action
              if (typeof window !== 'undefined' && window.taskApi) {
                window.taskApi.calendar.getOccurrencesForMonth(viewYear, viewMonth)
                  .then(setTaskCounts).catch(() => {})
                window.taskApi.tasks.getByDate(selectedDay)
                  .then(setSelectedTasks).catch(() => {})
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
