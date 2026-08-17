import { Notification, BrowserWindow, nativeImage } from 'electron'
import cron from 'node-cron'
import { getAll } from '../db/tasks'
import type { TaskWithDetails } from '../db/types'

// ────────────────────────────────────────────────────────────────────────────
// App icon — embedded as a base64 PNG so no file-path resolution is needed
// at runtime (works in both dev and packaged builds).
// 256×256 rounded-rect, IBM blue (#3b82d4) background, white checklist marks.
// macOS and Linux use this as the notification icon.
// Windows ignores the icon field and always shows the taskbar app icon instead.
// ────────────────────────────────────────────────────────────────────────────
const APP_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAAFJUlEQVR4nO3cXU4jSRCFUfY1u5s1' +
  '9lYQEi+MWowYmoFyVTnTkVH3hM6zVTb3Ew/8PD2/vJb46+9f8KFqh0+GzspaBlD+qXFJqwdQ/g' +
  'ERYrkAyj8RAi0RQPmnQLiyAMrfOXx4dADlbxi+eFAA5e8TNswNoPztwU2zAih/Y7DT+ADK3xIc' +
  'MjKA8jcDJ4wJoPxtwGn3BlD+BuBO5wMof3QY4kwA5Q8NAwmAaMcCKH9cGG5vAOUPCpMIgGi3Ayh' +
  '/RJhKAETbCqD84eABBEC07wMofyx4GAEQTQBE+xpA+QPBgwmAaAIgmgCI9l8A5Y8CJQRANAEQTQ' +
  'BEEwDRBEA0ARBNAET7HUD5Q0AhARBNAEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEA0ARBN' +
  'AEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEA0ARBNAEQTANEEQLSuAby9vZU/AxfQKYC3n6/' +
  '82WiqRwAb05cB92gQwM71a4ATVg/g0Po1wFFLB3Bi/RrgkNAATr+y23/l++kdwNRPf9CX2G1d+Y' +
  'QEIIDKKiQAAVRe+YQEIIDKKydQ4wBmfwGGvL7bvvIVNQ7Ad4ALXPmEBCCAyiufkAAEUHnlExKA' +
  'ACqvfEK9A/CT4O5Xvh8BwA1LB+C3QZlt9QD8PQBTNQjAX4QxT48A3pk+w3UK4DOjZ4iuAcAQ' +
  'AiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmA' +
  'aAIgmgCIJgCiCYBoXQPwn+EYolMA/jcow/UIwH+HZpIGAexcvwY4YfUADq1fAxy1dAAn1q8B' +
  'DgkN4PQru/1Xvp/eAUz99Ad9id3WlU9IAAKovPIJCUAAlVc+IQEIoPLKJ9Q4gNlfgCGv77av' +
  'fEWNA/Ad4AJXPiEBCKDyyiekAAFUXvmEBCCAyiufUO8A/CS4+5XvRwBww9IB+G1QZls9AH8P' +
  'wFQNAvAXYczTI4B3ps9wnQL4zOgZomsAMIQAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJ' +
  'gGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAonUNwH+GY4hOAfjf' +
  'oAzXIwD/HZpJGgSwc/0a4ITVAzi0fg1w1NIBnFi/BjgkNIDTr+z2X/l+egcw9dMf9CV2W1c+' +
  'IQEIoPLKJyQAAVRe+YQEIIDKKydQ4wBmfwGGvL7bvvIVNQ7Ad4ALXPmEBCCAyiufkAAEUHnl' +
  'ExKAACqvfEK9A/CT4O5Xvh8BwA1LB+C3QZlt9QD8PQBTNQjAX4QxT48A3pk+w3UK4DOjZ4iu' +
  'AcAQAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYA' +
  'ogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGhPzy+v5Q8BJZ5fXgVALgEQTQBEEwDRBEA0ARBN' +
  'AET7NwANEOh9+QIglACIJgCi/RGABojyMXsBkEgARPsmAA0Q4vPmBUCcHwPQAJf3ZfACIMuN' +
  'ADTAhf1/7QIgyK4ANMAlfTv17wPQABfz084FQITDAWiAy9gY+VYAGuACthd+IwAN0Nqe8+0A' +
  'NECT+7a9KwAN0M6eYe8NQAMs7OheDwcgA9Z0bsknA9AASzk94/MByIAV3DngewOQAVWGTHdM' +
  'ADLgkQaOdmQASmCqGVudEoAYGGX2PqcHIAz2qNrhP0+LL3RCy7EEAAAAAElFTkSuQmCC'

const APP_ICON = nativeImage.createFromDataURL('data:image/png;base64,' + APP_ICON_B64.replace(/\n/g, ''))

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
