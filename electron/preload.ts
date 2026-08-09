import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc/channels'

// Expose a safe one-way listener bridge so the renderer can receive messages
// from the main process (e.g. quick-add-task trigger from global shortcut).
contextBridge.exposeInMainWorld('electronBridge', {
  on:  (channel: string, cb: (...args: unknown[]) => void) => {
    const allowed = ['quick-add-task']
    if (!allowed.includes(channel)) return
    ipcRenderer.on(channel, (_event, ...args) => cb(...args))
  },
  off: (channel: string, cb: (...args: unknown[]) => void) => {
    const allowed = ['quick-add-task']
    if (!allowed.includes(channel)) return
    ipcRenderer.removeListener(channel, cb as Parameters<typeof ipcRenderer.removeListener>[1])
  },
})

// Helper: invoke an IPC channel and unwrap the result envelope
const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> =>
  ipcRenderer.invoke(channel, ...args).then((res: { success: boolean; data?: T; error?: string }) => {
    if (res && res.success === false) throw new Error(res.error)
    return res.data as T
  })

contextBridge.exposeInMainWorld('taskApi', {
  tasks: {
    getAll:    (filters?: unknown) => invoke(IPC.TASKS.GET_ALL, filters),
    getById:   (id: number) => invoke(IPC.TASKS.GET_BY_ID, id),
    getToday:  () => invoke(IPC.TASKS.GET_TODAY),
    getByDate: (date: string) => invoke(IPC.TASKS.GET_BY_DATE, date),
    create:    (data: unknown) => invoke(IPC.TASKS.CREATE, data),
    update:    (id: number, data: unknown) => invoke(IPC.TASKS.UPDATE, id, data),
    delete:    (id: number) => invoke(IPC.TASKS.DELETE, id),
    archive:   (id: number) => invoke(IPC.TASKS.ARCHIVE, id),
    reorder:   (ids: number[]) => invoke(IPC.TASKS.REORDER, ids),
  },
  categories: {
    getAll:  () => invoke(IPC.CATEGORIES.GET_ALL),
    create:  (data: unknown) => invoke(IPC.CATEGORIES.CREATE, data),
    update:  (id: number, data: unknown) => invoke(IPC.CATEGORIES.UPDATE, id, data),
    delete:  (id: number) => invoke(IPC.CATEGORIES.DELETE, id),
    reorder: (ids: number[]) => invoke(IPC.CATEGORIES.REORDER, ids),
  },
  completions: {
    markComplete: (task_id: number, occurrence_date: string, notes?: string) =>
      invoke(IPC.COMPLETIONS.MARK_COMPLETE, task_id, occurrence_date, notes),
    markDeferred: (task_id: number, occurrence_date: string, deferred_to: string) =>
      invoke(IPC.COMPLETIONS.MARK_DEFERRED, task_id, occurrence_date, deferred_to),
    markSkipped:  (task_id: number, occurrence_date: string) =>
      invoke(IPC.COMPLETIONS.MARK_SKIPPED, task_id, occurrence_date),
    getForDate:   (date: string) => invoke(IPC.COMPLETIONS.GET_FOR_DATE, date),
    getHistory:   (task_id: number, limit?: number) =>
      invoke(IPC.COMPLETIONS.GET_HISTORY, task_id, limit),
    getStreak:      (task_id: number) => invoke(IPC.COMPLETIONS.GET_STREAK, task_id),
    deleteForDate:  (task_id: number, occurrence_date: string) =>
      invoke(IPC.COMPLETIONS.DELETE_FOR_DATE, task_id, occurrence_date),
  },
  subtasks: {
    getForTask: (task_id: number) => invoke(IPC.SUBTASKS.GET_FOR_TASK, task_id),
    create:     (task_id: number, title: string) => invoke(IPC.SUBTASKS.CREATE, task_id, title),
    update:     (id: number, data: unknown) => invoke(IPC.SUBTASKS.UPDATE, id, data),
    delete:     (id: number) => invoke(IPC.SUBTASKS.DELETE, id),
    reorder:    (task_id: number, ids: number[]) => invoke(IPC.SUBTASKS.REORDER, task_id, ids),
  },
  tags: {
    getAll:       () => invoke(IPC.TAGS.GET_ALL),
    create:       (name: string, color?: string) => invoke(IPC.TAGS.CREATE, name, color),
    update:       (id: number, data: unknown) => invoke(IPC.TAGS.UPDATE, id, data),
    delete:       (id: number) => invoke(IPC.TAGS.DELETE, id),
    setTaskTags:  (task_id: number, tag_ids: number[]) => invoke(IPC.TAGS.SET_TASK_TAGS, task_id, tag_ids),
    getForTask:   (task_id: number) => invoke(IPC.TAGS.GET_FOR_TASK, task_id),
  },
  analytics: {
    getWeeklyStats:   (weekOffset?: number) => invoke(IPC.ANALYTICS.GET_WEEKLY_STATS, weekOffset),
    getHeatmapData:   (days?: number) => invoke(IPC.ANALYTICS.GET_HEATMAP_DATA, days),
    exportTasks:      () => invoke(IPC.ANALYTICS.EXPORT_TASKS),
    exportCompletions: () => invoke(IPC.ANALYTICS.EXPORT_COMPLETIONS),
  },
  app: {
    getVersion:       () => invoke(IPC.APP.GET_VERSION),
    openDataFolder:   () => invoke(IPC.APP.OPEN_DATA_FOLDER),
    updateTrayCount:  (count: number) => invoke(IPC.APP.UPDATE_TRAY_COUNT, count),
    snoozeTask:       (taskId: number, minutes: number) => invoke(IPC.APP.SNOOZE_TASK, taskId, minutes),
    saveExportFile:   (filename: string, content: string) => invoke(IPC.APP.SAVE_EXPORT_FILE, filename, content),
  },
  calendar: {
    getOccurrencesForMonth: (year: number, month: number) =>
      invoke(IPC.TASKS_CALENDAR.GET_OCCURRENCES_FOR_MONTH, year, month),
  },
})
