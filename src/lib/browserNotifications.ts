/**
 * Browser-side notification scheduler.
 * Uses the Web Notifications API + setInterval polling every 30 seconds.
 * Only active in browser mode — Electron uses its own node-cron scheduler.
 */

import type { TaskWithDetails } from '@/types'

const DEFAULT_TIME = '09:00'

// Tracks which task+date combos have already fired to avoid duplicates
const fired = new Set<string>()

// Active snooze timeouts
const snoozeTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
let _snoozeCounter = 0

let _interval: ReturnType<typeof setInterval> | null = null
let _getTasks: (() => Promise<TaskWithDetails[]>) | null = null

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ─── Snooze ───────────────────────────────────────────────────────────────────

function snoozeTask(task: TaskWithDetails, minutes: number) {
  const key = `snooze:${task.id}:${_snoozeCounter++}`
  const ms = minutes * 60 * 1000
  const timeout = setTimeout(() => {
    snoozeTimeouts.delete(key)
    fire(task) // re-fire after snooze without duplicate guard
  }, ms)
  snoozeTimeouts.set(key, timeout)
}

// ─── Fire a notification ──────────────────────────────────────────────────────

function fire(task: TaskWithDetails) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const body = task.category
      ? `${task.category.icon} ${task.category.name}${task.due_time ? '  ·  ⏰ ' + task.due_time : ''}`
      : task.due_time ? `⏰ Due at ${task.due_time}` : 'TaskFlow reminder'

    // Use the Actions API if supported (Chrome on some platforms)
    // Most browsers ignore unknown options silently so it's safe to include
    const notif = new Notification(`📋 ${task.title}`, {
      body,
      icon: '/favicon.ico',
      tag: `taskflow-${task.id}`,       // same tag = replaces previous notification for this task
      renotify: false,                   // don't re-alert if same tag is already shown
      requireInteraction: false,         // don't force the user to dismiss
    })

    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch {
    // Some browsers block notifications silently — ignore
  }
}

// ─── Check tasks on every tick ────────────────────────────────────────────────

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

async function tick() {
  if (!_getTasks) return
  const hhmm = nowHHMM()
  const today = todayISO()

  let tasks: TaskWithDetails[] = []
  try { tasks = await _getTasks() } catch { return }

  for (const task of tasks) {
    if (task.completion_today?.status === 'completed') continue

    const dueTime = task.due_time || DEFAULT_TIME
    if (dueTime !== hhmm) continue

    const key = `${task.id}:${today}:${hhmm}`
    if (fired.has(key)) continue

    fired.add(key)
    fire(task)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startBrowserScheduler(getTasks: () => Promise<TaskWithDetails[]>) {
  _getTasks = getTasks
  if (_interval) clearInterval(_interval)
  _interval = setInterval(tick, 30_000)
  tick() // run immediately on start
}

export function stopBrowserScheduler() {
  if (_interval) { clearInterval(_interval); _interval = null }
  for (const t of snoozeTimeouts.values()) clearTimeout(t)
  snoozeTimeouts.clear()
  _getTasks = null
}

/**
 * Manually snooze a task from the in-app UI (snooze button in notification banner).
 */
export function snoozeBrowserTask(task: TaskWithDetails, minutes: number) {
  snoozeTask(task, minutes)
}
