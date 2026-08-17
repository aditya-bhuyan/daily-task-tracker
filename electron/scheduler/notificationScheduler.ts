import { Notification, BrowserWindow, nativeImage } from 'electron'
import cron from 'node-cron'
import { getAll } from '../db/tasks'
import type { TaskWithDetails } from '../db/types'

// ────────────────────────────────────────────────────────────────────────────
// App icon — 256×256 RGBA PNG, IBM blue rounded-rect with white checklist marks,
// transparent background outside the rounded rect.
// macOS and Linux show this next to the notification text.
// Windows ignores the icon field and always uses the app's taskbar icon.
// ────────────────────────────────────────────────────────────────────────────
const APP_ICON_B64 =
  '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'

const APP_ICON = nativeImage.createFromDataURL('data:image/png;base64,' + APP_ICON_B64)

const scheduledJobs = new Map<string, cron.ScheduledTask>()

// Active snooze timeouts — keyed by "taskId:snoozeIndex" so multiple snoozes
// on the same task don't collide
const snoozeTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let _mainWindow: BrowserWindow | null = null

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_REMINDER_TIME = '09:00' // used when task has no due_time

function buildCronExpression(task: TaskWithDetails): string | null {
  const timeStr = task.due_time || DEFAULT_REMINDER_TIME
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  if (isNaN(hour) || isNaN(min)) return null

  const rec = task.recurrence
  if (!rec) {
    // One-time task — fire daily at that time as a standing reminder
    return `${min} ${hour} * * *`
  }

  switch (rec.type) {
    case 'daily':
    case 'hourly':
      return `${min} ${hour} * * *`
    case 'weekly': {
      let days: number[] = []
      if (rec.days_of_week) {
        try { days = JSON.parse(rec.days_of_week) } catch { /* ignore */ }
      }
      const dowStr = days.length > 0 ? days.join(',') : '*'
      return `${min} ${hour} * * ${dowStr}`
    }
    case 'monthly': {
      const dom = rec.day_of_month ?? '*'
      return `${min} ${hour} ${dom} * *`
    }
    case 'yearly': {
      const dom = rec.day_of_month ?? '*'
      const moy = rec.month_of_year ?? '*'
      return `${min} ${hour} ${dom} ${moy} *`
    }
    case 'custom':
      return rec.custom_cron && cron.validate(rec.custom_cron) ? rec.custom_cron : null
    default:
      return `${min} ${hour} * * *`
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Snooze
// ────────────────────────────────────────────────────────────────────────────

let _snoozeCounter = 0

/**
 * Schedule a snooze re-fire for a task after `minutes` minutes.
 */
export function snoozeTask(task: TaskWithDetails, minutes: number): void {
  const key = `${task.id}:${_snoozeCounter++}`
  const ms = minutes * 60 * 1000
  const timeout = setTimeout(() => {
    snoozeTimeouts.delete(key)
    fireNotification(task) // re-fires after snooze period
  }, ms)
  snoozeTimeouts.set(key, timeout)
}

export function cancelAllSnoozes(): void {
  for (const t of snoozeTimeouts.values()) clearTimeout(t)
  snoozeTimeouts.clear()
}

// ────────────────────────────────────────────────────────────────────────────
// Notification
// ────────────────────────────────────────────────────────────────────────────

export function fireNotification(task: TaskWithDetails): void {
  try {
    if (!Notification.isSupported()) return

    const categoryLine = task.category
      ? `${task.category.icon} ${task.category.name}`
      : 'TaskFlow'

    const dueTimeLine = task.due_time ? `⏰ Due at ${task.due_time}` : ''
    const body = [categoryLine, dueTimeLine].filter(Boolean).join('  ·  ')

    const notification = new Notification({
      title: `📋 ${task.title}`,
      body,
      // icon: shown next to the notification on macOS and Linux.
      // Windows ignores this field and always uses the app's taskbar icon.
      icon: APP_ICON,
      silent: false,
      // Actions appear as buttons in the Windows Action Center
      actions: [
        { type: 'button', text: 'Snooze 5 min' },
        { type: 'button', text: 'Snooze 10 min' },
        { type: 'button', text: 'Snooze 30 min' },
      ],
      closeButtonText: 'Dismiss',
      // urgency: Linux-only — 'critical' renders the notification with a
      // coloured (red/orange) accent in GNOME and KDE notification centres.
      urgency: 'critical',
      // timeoutType: controls Windows toast persistence
      timeoutType: 'default',
    })

    // Snooze button clicks
    notification.on('action', (_event, index) => {
      const snoozeMinutes = [5, 10, 30][index]
      if (snoozeMinutes !== undefined) {
        snoozeTask(task, snoozeMinutes)
      }
    })

    // Clicking the notification body opens/focuses the app
    notification.on('click', () => {
      if (_mainWindow) {
        _mainWindow.show()
        _mainWindow.focus()
        _mainWindow.webContents.send('navigate', 'today')
      }
    })

    notification.show()
  } catch {
    // Notifications may not work in all environments — fail silently
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Scheduler
// ────────────────────────────────────────────────────────────────────────────

export function stopScheduler(): void {
  for (const job of scheduledJobs.values()) job.stop()
  scheduledJobs.clear()
  cancelAllSnoozes()
}

export function rescheduleAll(mainWindow: BrowserWindow): void {
  _mainWindow = mainWindow
  stopScheduler()

  let tasks: TaskWithDetails[] = []
  try {
    tasks = getAll({ status: 'active' })
  } catch {
    return
  }

  for (const task of tasks) {
    const cronExpr = buildCronExpression(task)
    if (!cronExpr) continue
    if (!cron.validate(cronExpr)) continue

    const key = String(task.id)
    try {
      const job = cron.schedule(cronExpr, () => {
        fireNotification(task)
      })
      scheduledJobs.set(key, job)
    } catch {
      // Invalid cron or scheduling error — skip
    }
  }
}

export function startNotificationScheduler(mainWindow: BrowserWindow): void {
  _mainWindow = mainWindow
  rescheduleAll(mainWindow)

  // Re-schedule at midnight every day
  const midnight = cron.schedule('0 0 * * *', () => {
    rescheduleAll(mainWindow)
  })
  scheduledJobs.set('__midnight_refresh__', midnight)
}
