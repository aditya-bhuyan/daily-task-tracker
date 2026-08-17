/**
 * @file scheduler.ts
 * @description expo-notifications task reminder scheduler.
 *              Replaces node-cron from the desktop app.
 *              Schedules local push notifications for recurring and one-time tasks.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import type { TaskWithDetails } from '@taskflow/shared'
import { isDueOn } from '@taskflow/shared'

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKGROUND_FETCH_TASK = 'taskflow-background-fetch'
const NOTIFICATION_CHANNEL_ID = 'taskflow-reminders'

// ─── Notification handler (foreground) ───────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

// ─── Permission request ───────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  if (existingStatus === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ─── Android notification channel ────────────────────────────────────────────

export async function setupNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Task Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
    sound: 'default',
  })
}

// ─── Schedule a single task notification ─────────────────────────────────────

export async function scheduleTaskNotification(
  task: TaskWithDetails,
  triggerDate: Date
): Promise<string | null> {
  if (triggerDate <= new Date()) return null  // past — skip

  const hasPermission = await requestPermissions()
  if (!hasPermission) return null

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title:  `⏰ ${task.title}`,
      body:   task.description ?? 'Time to complete this task!',
      data:   { taskId: task.id },
      sound:  'default',
      categoryIdentifier: task.category?.name,
    },
    trigger: {
      date: triggerDate,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  })

  return id
}

// ─── Schedule all due-today reminders ────────────────────────────────────────

/**
 * Cancel all pending notifications and re-schedule reminders
 * for every task that is due today and has a due_time set.
 */
export async function scheduleDailyReminders(tasks: TaskWithDetails[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  for (const task of tasks) {
    if (!isDueOn(task, today)) continue
    if (!task.due_time) continue
    if (task.completion_today?.status === 'completed') continue

    const [hh, mm] = task.due_time.split(':').map(Number)
    const trigger = new Date(todayStr + 'T00:00:00')
    trigger.setHours(hh, mm, 0, 0)

    await scheduleTaskNotification(task, trigger)
  }
}

// ─── Schedule hourly task notifications ──────────────────────────────────────

export async function scheduleHourlyReminder(task: TaskWithDetails): Promise<string | null> {
  const hasPermission = await requestPermissions()
  if (!hasPermission) return null

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 ${task.title}`,
      body:  task.description ?? 'Hourly reminder',
      data:  { taskId: task.id },
      sound: 'default',
    },
    trigger: {
      seconds: 3600,
      repeats: true,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  })

  return id
}

// ─── Snooze a task ────────────────────────────────────────────────────────────

export async function snoozeTask(taskId: number, minutes: number): Promise<string | null> {
  const hasPermission = await requestPermissions()
  if (!hasPermission) return null

  const trigger = new Date(Date.now() + minutes * 60 * 1000)

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Snoozed Reminder',
      body:  `Task #${taskId} is ready for you`,
      data:  { taskId },
      sound: 'default',
    },
    trigger: {
      date: trigger,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  })

  return id
}

// ─── Background task registration ────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // Background fetch is used to re-schedule notifications at midnight
  // The actual data refresh is handled by the app when it comes to foreground
  return TaskManager.TaskManagerTaskBody
})

export { BACKGROUND_FETCH_TASK }
