/**
 * @file recurrenceEngine.ts
 * @description Pure recurrence engine — zero dependencies on Electron, Node,
 *              SQLite, React Native or any platform-specific API.
 *              100% reusable between desktop and mobile.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import type { Task, Recurrence } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Return true if the date falls on a weekday (Mon–Fri) */
function isWeekday(d: Date): boolean {
  const day = d.getDay()
  return day >= 1 && day <= 5
}

/** Return true if the date falls on a weekend (Sat–Sun) */
function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

// ─── schedule_type guard ──────────────────────────────────────────────────────

function matchesScheduleType(task: Pick<Task, 'schedule_type'>, date: Date): boolean {
  switch (task.schedule_type) {
    case 'weekday': return isWeekday(date)
    case 'weekend': return isWeekend(date)
    default:        return true
  }
}

// ─── Recurrence window check ──────────────────────────────────────────────────

function isWithinRecurrenceWindow(rec: Recurrence, date: Date, startDate: Date): boolean {
  if (date < startDate) return false
  if (rec.ends_on) {
    const end = new Date(rec.ends_on + 'T23:59:59')
    if (date > end) return false
  }
  return true
}

// ─── Core: isDueOn ───────────────────────────────────────────────────────────

/**
 * Determine whether a task is due on a given date.
 *
 * Rules:
 *  1. Archived tasks are never due.
 *  2. If the task has a schedule_type, it must match (weekday/weekend/any).
 *  3. If the task has no recurrence → due only on its due_date (or every day if no due_date set).
 *  4. If the task has a recurrence → apply the recurrence pattern starting from due_date (or created_at).
 */
export function isDueOn(task: Pick<Task, 'status' | 'schedule_type' | 'due_date' | 'created_at'> & { recurrence?: Recurrence }, date: Date): boolean {
  if (task.status === 'archived') return false
  if (!matchesScheduleType(task, date)) return false

  const rec = task.recurrence

  if (!rec) {
    // One-time task
    if (!task.due_date) return true               // floating task — always show
    return isoDate(date) === task.due_date
  }

  // Recurring task — anchor is due_date or created_at
  const anchorStr = task.due_date ?? task.created_at.slice(0, 10)
  const anchor = new Date(anchorStr + 'T00:00:00')

  if (!isWithinRecurrenceWindow(rec, date, anchor)) return false

  // ends_after: count occurrences from anchor up to date
  if (rec.ends_after !== null) {
    // We'll count occurrences from anchor up to (but not including) date
    // If count >= ends_after, task is no longer due
    let count = 0
    const cursor = new Date(anchor)
    while (isoDate(cursor) < isoDate(date)) {
      if (occursOnDate(rec, cursor, anchor)) count++
      if (count >= rec.ends_after) return false
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return occursOnDate(rec, date, anchor)
}

/** Low-level: does the recurrence pattern fire on this specific date given its anchor? */
function occursOnDate(rec: Recurrence, date: Date, anchor: Date): boolean {
  const interval = Math.max(1, rec.interval)

  switch (rec.type) {
    case 'daily': {
      const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000)
      return diffDays >= 0 && diffDays % interval === 0
    }

    case 'hourly': {
      // For mobile daily view: treat "hourly" as "fires every day"
      // (actual hour-level scheduling is handled by the notification scheduler)
      const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000)
      return diffDays >= 0
    }

    case 'weekly': {
      if (!rec.days_of_week) {
        // Fall back: same weekday as anchor
        const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000)
        if (diffDays < 0) return false
        const diffWeeks = Math.floor(diffDays / 7)
        return diffWeeks % interval === 0 && date.getDay() === anchor.getDay()
      }
      const targetDay = date.getDay().toString()
      if (!rec.days_of_week.split(',').includes(targetDay)) return false
      // Check interval: weeks since anchor
      const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000)
      const diffWeeks = Math.floor(Math.abs(diffDays) / 7)
      return diffWeeks % interval === 0
    }

    case 'monthly': {
      const targetDay = rec.day_of_month ?? anchor.getDate()
      if (date.getDate() !== targetDay) return false
      const monthDiff =
        (date.getFullYear() - anchor.getFullYear()) * 12 +
        (date.getMonth() - anchor.getMonth())
      return monthDiff >= 0 && monthDiff % interval === 0
    }

    case 'yearly': {
      const targetMonth = rec.month_of_year ?? anchor.getMonth() + 1
      const targetDay   = rec.day_of_month  ?? anchor.getDate()
      if (date.getMonth() + 1 !== targetMonth) return false
      if (date.getDate() !== targetDay)         return false
      const yearDiff = date.getFullYear() - anchor.getFullYear()
      return yearDiff >= 0 && yearDiff % interval === 0
    }

    case 'custom': {
      // Simple cron-like: only support "every N days" encoded as "0 0 */<N> * *"
      // For more complex cron, surface every day and let the scheduler handle it
      if (rec.custom_cron) {
        const match = rec.custom_cron.match(/^\d+\s+\d+\s+\*\/(\d+)\s+\*\s+\*$/)
        if (match) {
          const n = parseInt(match[1], 10)
          const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000)
          return diffDays >= 0 && diffDays % n === 0
        }
      }
      return true  // unknown cron → show every day (safe fallback)
    }

    default:
      return false
  }
}

// ─── getOccurrencesInRange ────────────────────────────────────────────────────

/**
 * Return all ISO date strings on which `task` is due within [startDate, endDate] inclusive.
 * Used by the calendar view to compute dot density per day.
 */
export function getOccurrencesInRange(
  task: Parameters<typeof isDueOn>[0],
  startDate: Date,
  endDate: Date
): string[] {
  const results: string[] = []
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (cursor <= end) {
    if (isDueOn(task, cursor)) {
      results.push(isoDate(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return results
}
