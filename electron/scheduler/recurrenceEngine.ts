import type { Task, Recurrence } from '../db/types'

type TaskWithRecurrence = Task & { recurrence?: Recurrence }

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((bUtc - aUtc) / msPerDay)
}

function isWeekday(d: Date): boolean {
  const day = d.getDay()
  return day >= 1 && day <= 5
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

// Minimal cron day-level matcher: parses "* * * * *" format and checks
// day-of-week (field 4) and day-of-month (field 2) only.
function matchesCron(cron: string, date: Date): boolean {
  try {
    const parts = cron.trim().split(/\s+/)
    if (parts.length < 5) return false
    const [, , domField, , dowField] = parts

    const domMatch = matchCronField(domField, date.getDate(), 1, 31)
    const dowMatch = matchCronField(dowField, date.getDay(), 0, 6)

    // Standard cron: if both dom and dow are specified (not *), match either
    const domIsWildcard = domField === '*'
    const dowIsWildcard = dowField === '*'
    if (!domIsWildcard && !dowIsWildcard) return domMatch || dowMatch
    return domMatch && dowMatch
  } catch {
    return false
  }
}

function matchCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true
  for (const part of field.split(',')) {
    if (part.includes('/')) {
      const [rangeStr, stepStr] = part.split('/')
      const step = parseInt(stepStr, 10)
      const [lo, hi] = rangeStr === '*'
        ? [min, max]
        : rangeStr.split('-').map(Number)
      for (let i = lo; i <= hi; i += step) {
        if (i === value) return true
      }
    } else if (part.includes('-')) {
      const [lo, hi] = part.split('-').map(Number)
      if (value >= lo && value <= hi) return true
    } else {
      if (parseInt(part, 10) === value) return true
    }
  }
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Core: isDueOn
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the task is due on the given targetDate.
 * Pure function — no side effects, no DB calls.
 * @param completionCount  Optional: number of completions so far (for ends_after check).
 */
export function isDueOn(
  task: TaskWithRecurrence,
  targetDate: Date,
  completionCount = 0
): boolean {
  // 1. Schedule type gate
  if (task.schedule_type === 'weekday' && !isWeekday(targetDate)) return false
  if (task.schedule_type === 'weekend' && !isWeekend(targetDate)) return false

  // 2. Start date gate: task not due before its creation date
  const createdDate = parseISO(task.created_at.slice(0, 10))
  if (daysBetween(createdDate, targetDate) < 0) return false

  // 3. Non-recurring (one-time) task
  if (!task.recurrence_id || !task.recurrence) {
    if (!task.due_date) return false
    return task.due_date === toISO(targetDate)
  }

  const rec = task.recurrence

  // 4. Recurrence end conditions
  if (rec.ends_on) {
    const endsDate = parseISO(rec.ends_on)
    if (daysBetween(endsDate, targetDate) > 0) return false
  }
  if (rec.ends_after !== null && completionCount >= rec.ends_after) return false

  // 5. Type-based check
  const interval = rec.interval ?? 1

  switch (rec.type) {
    case 'daily': {
      const diff = daysBetween(createdDate, targetDate)
      return diff >= 0 && diff % interval === 0
    }

    case 'hourly': {
      // Hourly tasks are considered due every day (time-of-day handled by notifications)
      const diff = daysBetween(createdDate, targetDate)
      return diff >= 0
    }

    case 'weekly': {
      let daysOfWeek: number[] = []
      if (rec.days_of_week) {
        try { daysOfWeek = JSON.parse(rec.days_of_week) } catch { /* ignore */ }
      }
      if (daysOfWeek.length === 0) {
        // Fall back: same day-of-week as creation
        daysOfWeek = [createdDate.getDay()]
      }
      if (!daysOfWeek.includes(targetDate.getDay())) return false
      // Check week interval
      const weeksDiff = Math.floor(daysBetween(createdDate, targetDate) / 7)
      return weeksDiff >= 0 && weeksDiff % interval === 0
    }

    case 'monthly': {
      const dom = rec.day_of_month ?? createdDate.getDate()
      if (targetDate.getDate() !== dom) return false
      const monthsDiff =
        (targetDate.getFullYear() - createdDate.getFullYear()) * 12 +
        (targetDate.getMonth() - createdDate.getMonth())
      return monthsDiff >= 0 && monthsDiff % interval === 0
    }

    case 'yearly': {
      const dom = rec.day_of_month ?? createdDate.getDate()
      const moy = rec.month_of_year ?? createdDate.getMonth() + 1
      if (targetDate.getMonth() + 1 !== moy) return false
      if (targetDate.getDate() !== dom) return false
      const yearsDiff = targetDate.getFullYear() - createdDate.getFullYear()
      return yearsDiff >= 0 && yearsDiff % interval === 0
    }

    case 'custom': {
      if (!rec.custom_cron) return false
      return matchesCron(rec.custom_cron, targetDate)
    }

    default:
      return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// getOccurrencesInRange
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns ISO date strings for all occurrences of a task within
 * [startDate, endDate] inclusive.
 */
export function getOccurrencesInRange(
  task: TaskWithRecurrence,
  startDate: Date,
  endDate: Date,
  completionCount = 0
): string[] {
  const results: string[] = []
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (cursor <= end) {
    if (isDueOn(task, cursor, completionCount)) {
      results.push(toISO(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return results
}
