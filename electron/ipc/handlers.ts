import { IpcMain, BrowserWindow, app, shell, dialog } from 'electron'
import { join, basename } from 'path'
import { writeFileSync } from 'fs'
import { IPC } from './channels'
import * as tasks from '../db/tasks'
import * as categories from '../db/categories'
import * as recurrences from '../db/recurrences'
import * as completions from '../db/completions'
import * as subtasks from '../db/subtasks'
import * as tags from '../db/tags'
import * as analytics from '../db/analytics'
import { updateTrayTooltip } from '../tray/tray'
import { rescheduleAll, snoozeTask } from '../scheduler/notificationScheduler'

type IpcResult<T> = { success: true; data: T } | { success: false; error: string }

function ok<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

function fail(err: unknown): IpcResult<never> {
  const message = err instanceof Error ? err.message : String(err)
  return { success: false, error: message }
}

export function registerHandlers(ipcMain: IpcMain, mainWindow: BrowserWindow): void {
  // ── Tasks ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TASKS.GET_ALL, (_e, filters?) => {
    try { return ok(tasks.getAll(filters)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.GET_BY_ID, (_e, id: number) => {
    try { return ok(tasks.getById(id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.GET_TODAY, (_e) => {
    try { return ok(tasks.getTodayTasks()) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.GET_BY_DATE, (_e, date: string) => {
    try { return ok(tasks.getByDate(date)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.CREATE, (_e, data) => {
    try {
      const result = tasks.create(data)
      rescheduleAll(mainWindow)
      return ok(result)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.UPDATE, (_e, id: number, data) => {
    try {
      const result = tasks.update(id, data)
      rescheduleAll(mainWindow)
      return ok(result)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.DELETE, (_e, id: number) => {
    try {
      const result = tasks.deleteTask(id)
      rescheduleAll(mainWindow)
      return ok(result)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.ARCHIVE, (_e, id: number) => {
    try {
      const result = tasks.archive(id)
      rescheduleAll(mainWindow)
      return ok(result)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TASKS.REORDER, (_e, ids: number[]) => {
    try { tasks.reorderTasks(ids); return ok(true) } catch (e) { return fail(e) }
  })

  // ── Categories ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.CATEGORIES.GET_ALL, (_e) => {
    try { return ok(categories.getAll()) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.CATEGORIES.CREATE, (_e, data) => {
    try { return ok(categories.create(data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.CATEGORIES.UPDATE, (_e, id: number, data) => {
    try { return ok(categories.update(id, data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.CATEGORIES.DELETE, (_e, id: number) => {
    try { return ok(categories.deleteCategory(id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.CATEGORIES.REORDER, (_e, ids: number[]) => {
    try { categories.reorder(ids); return ok(true) } catch (e) { return fail(e) }
  })

  // ── Completions ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.COMPLETIONS.MARK_COMPLETE, (_e, task_id: number, occurrence_date: string, notes?: string) => {
    try { return ok(completions.markComplete(task_id, occurrence_date, notes)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.MARK_DEFERRED, (_e, task_id: number, occurrence_date: string, deferred_to: string) => {
    try { return ok(completions.markDeferred(task_id, occurrence_date, deferred_to)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.MARK_SKIPPED, (_e, task_id: number, occurrence_date: string) => {
    try { return ok(completions.markSkipped(task_id, occurrence_date)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.GET_FOR_DATE, (_e, date: string) => {
    try { return ok(completions.getForDate(date)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.GET_HISTORY, (_e, task_id: number, limit?: number) => {
    try { return ok(completions.getHistory(task_id, limit)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.GET_STREAK, (_e, task_id: number) => {
    try { return ok(completions.getStreak(task_id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.COMPLETIONS.DELETE_FOR_DATE, (_e, task_id: number, occurrence_date: string) => {
    try { return ok(completions.deleteForDate(task_id, occurrence_date)) } catch (e) { return fail(e) }
  })

  // ── Subtasks ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SUBTASKS.GET_FOR_TASK, (_e, task_id: number) => {
    try { return ok(subtasks.getForTask(task_id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.SUBTASKS.CREATE, (_e, task_id: number, title: string) => {
    try { return ok(subtasks.create(task_id, title)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.SUBTASKS.UPDATE, (_e, id: number, data) => {
    try { return ok(subtasks.update(id, data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.SUBTASKS.DELETE, (_e, id: number) => {
    try { return ok(subtasks.deleteSubtask(id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.SUBTASKS.REORDER, (_e, task_id: number, ids: number[]) => {
    try { subtasks.reorder(task_id, ids); return ok(true) } catch (e) { return fail(e) }
  })

  // ── Tags ───────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TAGS.GET_ALL, (_e) => {
    try { return ok(tags.getAll()) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TAGS.CREATE, (_e, name: string, color?: string) => {
    try { return ok(tags.create(name, color)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TAGS.UPDATE, (_e, id: number, data) => {
    try { return ok(tags.update(id, data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TAGS.DELETE, (_e, id: number) => {
    try { return ok(tags.deleteTag(id)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TAGS.SET_TASK_TAGS, (_e, task_id: number, tag_ids: number[]) => {
    try { tags.setTaskTags(task_id, tag_ids); return ok(true) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.TAGS.GET_FOR_TASK, (_e, task_id: number) => {
    try { return ok(tags.getForTask(task_id)) } catch (e) { return fail(e) }
  })

  // ── Analytics ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.ANALYTICS.GET_WEEKLY_STATS, (_e, weekOffset?: number) => {
    try { return ok(analytics.getWeeklyStats(weekOffset)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.ANALYTICS.GET_HEATMAP_DATA, (_e, days?: number) => {
    try { return ok(analytics.getHeatmapData(days)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.ANALYTICS.EXPORT_TASKS, (_e) => {
    try { return ok(analytics.exportTasks()) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.ANALYTICS.EXPORT_COMPLETIONS, (_e) => {
    try { return ok(analytics.exportCompletions()) } catch (e) { return fail(e) }
  })

  // ── Recurrences ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.RECURRENCES.CREATE, (_e, data) => {
    try { return ok(recurrences.create(data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.RECURRENCES.UPDATE, (_e, id: number, data) => {
    try { return ok(recurrences.update(id, data)) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.RECURRENCES.DELETE, (_e, id: number) => {
    try { return ok(recurrences.deleteRecurrence(id)) } catch (e) { return fail(e) }
  })

  // ── App ────────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.APP.GET_VERSION, (_e) => {
    try { return ok(app.getVersion()) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.APP.OPEN_DATA_FOLDER, (_e) => {
    try {
      shell.openPath(join(app.getPath('userData')))
      return ok(true)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.APP.UPDATE_TRAY_COUNT, (_e, count: number) => {
    try { updateTrayTooltip(count); return ok(true) } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.APP.SNOOZE_TASK, (_e, taskId: number, minutes: number) => {
    try {
      const task = tasks.getById(taskId)
      if (!task) return ok(false)
      snoozeTask(task, minutes)
      return ok(true)
    } catch (e) { return fail(e) }
  })

  ipcMain.handle(IPC.APP.SAVE_EXPORT_FILE, async (_e, filename: string, content: string) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Export',
        defaultPath: join(app.getPath('downloads'), filename),
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (canceled || !filePath) return ok('')
      writeFileSync(filePath, content, 'utf-8')
      return ok(basename(filePath))
    } catch (e) { return fail(e) }
  })

  // ── Calendar ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TASKS_CALENDAR.GET_OCCURRENCES_FOR_MONTH, (_e, year: number, month: number) => {
    try { return ok(tasks.getOccurrencesForMonth(year, month)) } catch (e) { return fail(e) }
  })
}
